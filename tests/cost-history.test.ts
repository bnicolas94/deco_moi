import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCostHistoryState, isCostHistoryAuthoritative } from '../src/lib/costs/history.ts';

test('separa las versiones activas por tipo de entidad', () => {
    const state = buildCostHistoryState([
        { entityType: 'cost_item', snapshot: { id: 1, value: '10' } },
        { entityType: 'supply', snapshot: { id: 2, unit_cost: '20' } },
        { entityType: 'product_cost_item', snapshot: { product_id: 3, cost_item_id: 1 } },
        { entityType: 'product_supply', snapshot: { product_id: 3, supply_id: 2 } },
    ]);

    assert.equal(state.costItems[0].value, '10');
    assert.equal(state.supplies[0].unit_cost, '20');
    assert.equal(state.productCostItems[0].product_id, 3);
    assert.equal(state.productSupplies[0].supply_id, 2);
});

test('solo considera autoritativas fechas posteriores al inicio del historial', () => {
    const startedAt = new Date('2026-08-25T12:00:00Z');
    assert.equal(isCostHistoryAuthoritative(new Date('2026-08-25T11:59:59Z'), startedAt), false);
    assert.equal(isCostHistoryAuthoritative(new Date('2026-08-25T12:00:00Z'), startedAt), true);
    assert.equal(isCostHistoryAuthoritative(new Date('2026-08-26T00:00:00Z'), startedAt), true);
});
