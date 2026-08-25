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
    static async replaceConfiguredCosts(items: CostSnapshotItem[], channel: SalesChannel, database: any = db): Promise<void> {
        if (items.length === 0) return;

        const itemIds = items.map(item => item.id);
        const productIds = [...new Set(items.map(item => item.productId))];

        await database.delete(orderItemCosts).where(and(
            inArray(orderItemCosts.orderItemId, itemIds),
            inArray(orderItemCosts.source, ['configuration', 'production'])
        ));

        const linkedCosts = await database.select({
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

        const globalCosts = await database.select().from(costItems).where(and(
            eq(costItems.isActive, true),
            eq(costItems.isGlobal, true)
        ));

        const linkedSupplies = await database.select({
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
            const productCosts = linkedCosts.filter((cost: any) =>
                cost.productId === item.productId &&
                cost.isActive &&
                appliesToChannel(cost.appliesToChannels, channel)
            );

            const merged = [...productCosts];
            for (const globalCost of globalCosts) {
                if (!appliesToChannel(globalCost.appliesToChannels, channel)) continue;
                if (!merged.some((cost: any) => cost.id === globalCost.id || cost.name === globalCost.name)) {
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

            for (const supply of linkedSupplies.filter((s: any) => s.productId === item.productId && s.isActive)) {
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
            await database.insert(orderItemCosts).values(rows);
        }
    }

    /** Recalculates amounts using the unit values already frozen in the snapshot. */
    static async rescaleExistingCosts(items: CostSnapshotItem[], database: any = db): Promise<void> {
        if (items.length === 0) return;

        const itemById = new Map(items.map(item => [item.id, item]));
        const rows = await database.select().from(orderItemCosts).where(and(
            inArray(orderItemCosts.orderItemId, items.map(item => item.id)),
            inArray(orderItemCosts.source, ['configuration', 'production'])
        ));

        for (const row of rows) {
            const item = itemById.get(row.orderItemId);
            if (!item) continue;
            const configuredValue = Number(row.configuredValue || 0);
            const amount = row.costItemType === 'percentage'
                ? Number(item.netRevenue ?? (Number(item.unitPrice) * item.quantity)) * configuredValue / 100
                : configuredValue * Number(item.internalUnits || item.quantity || 1);
            await database.update(orderItemCosts)
                .set({ calculatedAmount: toMoney(amount) })
                .where(eq(orderItemCosts.id, row.id));
        }
    }
}
