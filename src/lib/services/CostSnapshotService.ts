import { and, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
    costConfigurationHistory,
    costHistoryMetadata,
    costItems,
    orderItemCosts,
    productCostItems,
    productSupplies,
    supplies,
} from '@/lib/db/schema';
import { buildCostHistoryState, isCostHistoryAuthoritative } from '@/lib/costs/history';

export type SalesChannel = 'app' | 'mercadolibre';

export interface CostSnapshotItem {
    id: number;
    productId: number;
    quantity: number;
    unitPrice: string | number;
    internalUnits?: number | null;
    netRevenue?: string | number | null;
}

export interface CostSnapshotOptions {
    database?: any;
    effectiveAt?: Date;
}

function appliesToChannel(channels: unknown, channel: SalesChannel): boolean {
    if (!Array.isArray(channels) || channels.length === 0) return true;
    return channels.includes(channel);
}

function toMoney(value: number): string {
    return (Math.round(value * 100) / 100).toFixed(2);
}

async function loadCurrentConfiguration(productIds: number[], database: any) {
    const linkedCosts = await database.select({
        productId: productCostItems.productId,
        id: costItems.id,
        name: costItems.name,
        type: costItems.type,
        value: costItems.value,
        category: costItems.category,
        appliesToChannels: costItems.appliesToChannels,
        isActive: costItems.isActive,
    }).from(productCostItems)
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
    }).from(productSupplies)
        .innerJoin(supplies, eq(productSupplies.supplyId, supplies.id))
        .where(inArray(productSupplies.productId, productIds));
    return { linkedCosts, globalCosts, linkedSupplies };
}

async function loadHistoricalConfiguration(productIds: number[], effectiveAt: Date, database: any) {
    const [metadata] = await database.select().from(costHistoryMetadata).where(eq(costHistoryMetadata.id, 1)).limit(1);
    if (!isCostHistoryAuthoritative(effectiveAt, metadata?.trackingStartedAt || null)) return null;
    const records = await database.select({
        entityType: costConfigurationHistory.entityType,
        snapshot: costConfigurationHistory.snapshot,
    }).from(costConfigurationHistory).where(and(
        lte(costConfigurationHistory.validFrom, effectiveAt),
        or(isNull(costConfigurationHistory.validTo), gt(costConfigurationHistory.validTo, effectiveAt))
    ));
    const state = buildCostHistoryState(records);
    const costsById = new Map(state.costItems.map(item => [Number(item.id), item]));
    const suppliesById = new Map(state.supplies.map(item => [Number(item.id), item]));
    const linkedCosts = state.productCostItems
        .filter(link => productIds.includes(Number(link.product_id)))
        .map(link => ({ productId: Number(link.product_id), cost: costsById.get(Number(link.cost_item_id)) }))
        .filter(entry => entry.cost?.is_active)
        .map(({ productId, cost }) => ({
            productId,
            id: Number(cost!.id),
            name: cost!.name,
            type: cost!.type,
            value: cost!.value,
            category: cost!.category,
            appliesToChannels: cost!.applies_to_channels,
            isActive: cost!.is_active,
        }));
    const globalCosts = state.costItems.filter(cost => cost.is_active && cost.is_global).map(cost => ({
        id: Number(cost.id),
        name: cost.name,
        type: cost.type,
        value: cost.value,
        category: cost.category,
        appliesToChannels: cost.applies_to_channels,
        isActive: cost.is_active,
        isGlobal: cost.is_global,
    }));
    const linkedSupplies = state.productSupplies
        .filter(link => productIds.includes(Number(link.product_id)))
        .map(link => ({ link, supply: suppliesById.get(Number(link.supply_id)) }))
        .filter(entry => entry.supply?.is_active)
        .map(({ link, supply }) => ({
            productId: Number(link.product_id),
            supplyId: Number(supply!.id),
            supplyName: supply!.name,
            quantity: link.quantity,
            partsUsed: link.parts_used,
            partsTotal: link.parts_total,
            unitCost: supply!.unit_cost,
            isActive: supply!.is_active,
        }));
    return { linkedCosts, globalCosts, linkedSupplies };
}

export class CostSnapshotService {
    static async replaceConfiguredCosts(
        items: CostSnapshotItem[],
        channel: SalesChannel,
        options: CostSnapshotOptions = {}
    ): Promise<void> {
        if (items.length === 0) return;
        const database = options.database || db;
        const productIds = [...new Set(items.map(item => item.productId))];
        await database.delete(orderItemCosts).where(and(
            inArray(orderItemCosts.orderItemId, items.map(item => item.id)),
            inArray(orderItemCosts.source, ['configuration', 'production'])
        ));
        const historical = options.effectiveAt
            ? await loadHistoricalConfiguration(productIds, options.effectiveAt, database)
            : null;
        const historicalFallback = Boolean(options.effectiveAt && !historical);
        const { linkedCosts, globalCosts, linkedSupplies } = historical
            || await loadCurrentConfiguration(productIds, database);
        const rows: typeof orderItemCosts.$inferInsert[] = [];

        for (const item of items) {
            const internalUnits = Number(item.internalUnits || item.quantity || 1);
            const revenueBase = Number(item.netRevenue ?? (Number(item.unitPrice) * item.quantity));
            const productCosts = linkedCosts.filter((cost: any) =>
                cost.productId === item.productId && cost.isActive && appliesToChannel(cost.appliesToChannels, channel)
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
                const amount = isPercentage ? revenueBase * configuredValue / 100 : configuredValue * internalUnits;
                rows.push({
                    orderItemId: item.id,
                    costItemName: configuredCost.name,
                    costItemType: configuredCost.type,
                    configuredValue: toMoney(configuredValue),
                    calculatedAmount: toMoney(amount),
                    costCode: `configured_${configuredCost.id}`,
                    category: configuredCost.category || 'operational',
                    nature: isPercentage ? 'variable' : 'fixed',
                    calculationBasis: historicalFallback ? 'current_value_fallback' : (isPercentage ? 'percent_net_revenue' : 'per_internal_unit'),
                    source: 'configuration',
                    salesChannel: channel,
                    isEstimated: historicalFallback,
                    affectsProfit: true,
                    effectiveAt: options.effectiveAt,
                });
            }
            for (const supply of linkedSupplies.filter((entry: any) => entry.productId === item.productId && entry.isActive)) {
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
                    calculationBasis: historicalFallback ? 'current_value_fallback' : 'per_internal_unit',
                    source: 'production',
                    salesChannel: channel,
                    isEstimated: historicalFallback,
                    affectsProfit: true,
                    effectiveAt: options.effectiveAt,
                });
            }
        }
        if (rows.length > 0) await database.insert(orderItemCosts).values(rows);
    }

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
