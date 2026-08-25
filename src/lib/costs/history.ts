export interface CostHistoryRecord {
    entityType: string;
    snapshot: Record<string, any>;
}

export interface CostHistoryState {
    costItems: Record<string, any>[];
    supplies: Record<string, any>[];
    productCostItems: Record<string, any>[];
    productSupplies: Record<string, any>[];
}

export function isCostHistoryAuthoritative(effectiveAt: Date, trackingStartedAt: Date | null): boolean {
    return Boolean(trackingStartedAt && effectiveAt.getTime() >= trackingStartedAt.getTime());
}

export function buildCostHistoryState(records: CostHistoryRecord[]): CostHistoryState {
    const state: CostHistoryState = {
        costItems: [],
        supplies: [],
        productCostItems: [],
        productSupplies: [],
    };
    for (const record of records) {
        if (record.entityType === 'cost_item') state.costItems.push(record.snapshot);
        else if (record.entityType === 'supply') state.supplies.push(record.snapshot);
        else if (record.entityType === 'product_cost_item') state.productCostItems.push(record.snapshot);
        else if (record.entityType === 'product_supply') state.productSupplies.push(record.snapshot);
    }
    return state;
}
