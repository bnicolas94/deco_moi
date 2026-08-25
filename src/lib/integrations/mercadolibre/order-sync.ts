import { allocateMoney } from './financials.ts';

export interface ExistingOrderItemIdentity {
    id: number;
    externalItemId?: string | null;
    externalVariationId?: string | null;
}

export interface DesiredOrderItemIdentity {
    meliItemId: string;
    variationId?: string | null;
}

export interface OrderItemSyncPlan {
    matches: Array<{ existingId: number; desiredIndex: number }>;
    insertIndexes: number[];
    staleExistingIds: number[];
}

function lineKey(itemId: unknown, variationId: unknown): string {
    return `${String(itemId || '')}::${String(variationId || '')}`;
}

/** Matches repeated lines one-to-one while respecting item and variation identity. */
export function planOrderItemSync(
    existingItems: ExistingOrderItemIdentity[],
    desiredItems: DesiredOrderItemIdentity[]
): OrderItemSyncPlan {
    const availableByKey = new Map<string, ExistingOrderItemIdentity[]>();
    for (const item of existingItems) {
        const key = lineKey(item.externalItemId, item.externalVariationId);
        availableByKey.set(key, [...(availableByKey.get(key) || []), item]);
    }

    const matches: OrderItemSyncPlan['matches'] = [];
    const insertIndexes: number[] = [];
    desiredItems.forEach((item, desiredIndex) => {
        const key = lineKey(item.meliItemId, item.variationId);
        const available = availableByKey.get(key) || [];
        const existing = available.shift();
        availableByKey.set(key, available);
        if (existing) matches.push({ existingId: existing.id, desiredIndex });
        else insertIndexes.push(desiredIndex);
    });

    return {
        matches,
        insertIndexes,
        staleExistingIds: [...availableByKey.values()].flat().map(item => item.id),
    };
}

export function allocateOrderLineRevenue(total: number, lineRevenues: number[]): number[] {
    return allocateMoney(total, lineRevenues);
}
