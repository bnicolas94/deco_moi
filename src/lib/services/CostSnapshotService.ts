import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
    costItems,
    orderItemCosts,
    productCostItems,
    productSupplies,
    supplies,
} from '@/lib/db/schema';

export type SalesChannel = 'app' | 'mercadolibre';

export interface CostSnapshotItem {
    id: number;
    productId: number;
    quantity: number;
    unitPrice: string | number;
    internalUnits?: number | null;
    netRevenue?: string | number | null;
}

function appliesToChannel(channels: unknown, channel: SalesChannel): boolean {
    if (!Array.isArray(channels) || channels.length === 0) return true;
    return channels.includes(channel);
}

function toMoney(value: number): string {
    return (Math.round(value * 100) / 100).toFixed(2);
}

export class CostSnapshotService {
    /**
     * Rebuilds the internal cost snapshot for sold items. External marketplace,
     * payment and tax rows are deliberately kept separate.
     */
    static async replaceConfiguredCosts(items: CostSnapshotItem[], channel: SalesChannel): Promise<void> {
        if (items.length === 0) return;

        const itemIds = items.map(item => item.id);
        const productIds = [...new Set(items.map(item => item.productId))];

        await db.delete(orderItemCosts).where(and(
            inArray(orderItemCosts.orderItemId, itemIds),
            inArray(orderItemCosts.source, ['configuration', 'production'])
        ));

        const linkedCosts = await db.select({
            productId: productCostItems.productId,
            id: costItems.id,
            name: costItems.name,
            type: costItems.type,
            value: costItems.value,
            category: costItems.category,
            appliesToChannels: costItems.appliesToChannels,
            isActive: costItems.isActive,
        })
            .from(productCostItems)
            .innerJoin(costItems, eq(productCostItems.costItemId, costItems.id))
            .where(inArray(productCostItems.productId, productIds));

        const globalCosts = await db.select().from(costItems).where(and(
            eq(costItems.isActive, true),
            eq(costItems.isGlobal, true)
        ));

        const linkedSupplies = await db.select({
            productId: productSupplies.productId,
            supplyId: supplies.id,
            supplyName: supplies.name,
            quantity: productSupplies.quantity,
            partsUsed: productSupplies.partsUsed,
            partsTotal: productSupplies.partsTotal,
            unitCost: supplies.unitCost,
            isActive: supplies.isActive,
        })
            .from(productSupplies)
            .innerJoin(supplies, eq(productSupplies.supplyId, supplies.id))
            .where(inArray(productSupplies.productId, productIds));

        const rows: typeof orderItemCosts.$inferInsert[] = [];

        for (const item of items) {
            const internalUnits = Number(item.internalUnits || item.quantity || 1);
            const revenueBase = Number(item.netRevenue ?? (Number(item.unitPrice) * item.quantity));
            const productCosts = linkedCosts.filter(cost =>
                cost.productId === item.productId &&
                cost.isActive &&
                appliesToChannel(cost.appliesToChannels, channel)
            );

            const merged = [...productCosts];
            for (const globalCost of globalCosts) {
                if (!appliesToChannel(globalCost.appliesToChannels, channel)) continue;
                if (!merged.some(cost => cost.id === globalCost.id || cost.name === globalCost.name)) {
                    merged.push({ productId: item.productId, ...globalCost });
                }
            }

            for (const configuredCost of merged) {
                const configuredValue = Number(configuredCost.value);
                const isPercentage = configuredCost.type === 'percentage';
                const amount = isPercentage
                    ? revenueBase * (configuredValue / 100)
                    : configuredValue * internalUnits;

                rows.push({
                    orderItemId: item.id,
                    costItemName: configuredCost.name,
                    costItemType: configuredCost.type,
                    configuredValue: toMoney(configuredValue),
                    calculatedAmount: toMoney(amount),
                    costCode: `configured_${configuredCost.id}`,
                    category: configuredCost.category || 'operational',
                    nature: isPercentage ? 'variable' : 'fixed',
                    calculationBasis: isPercentage ? 'percent_net_revenue' : 'per_internal_unit',
                    source: 'configuration',
                    salesChannel: channel,
                    isEstimated: false,
                    affectsProfit: true,
                });
            }

            for (const supply of linkedSupplies.filter(s => s.productId === item.productId && s.isActive)) {
                let quantityPerUnit = Number(supply.quantity);
                if (supply.partsUsed && supply.partsTotal && Number(supply.partsTotal) !== 0) {
                    quantityPerUnit = Number(supply.partsUsed) / Number(supply.partsTotal);
                }
                const unitSupplyCost = quantityPerUnit * Number(supply.unitCost);

                rows.push({
                    orderItemId: item.id,
                    costItemName: `Insumo: ${supply.supplyName}`,
                    costItemType: 'fixed',
                    configuredValue: toMoney(unitSupplyCost),
                    calculatedAmount: toMoney(unitSupplyCost * internalUnits),
                    costCode: `supply_${supply.supplyId}`,
                    category: 'production',
                    nature: 'fixed',
                    calculationBasis: 'per_internal_unit',
                    source: 'production',
                    salesChannel: channel,
                    isEstimated: false,
                    affectsProfit: true,
                });
            }
        }

        if (rows.length > 0) {
            await db.insert(orderItemCosts).values(rows);
        }
    }
}
