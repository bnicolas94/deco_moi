import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateOrderLineRevenue, planOrderItemSync } from '../src/lib/integrations/mercadolibre/order-sync.ts';

test('conserva la línea que coincide por publicación y variación', () => {
    const plan = planOrderItemSync(
        [
            { id: 1, externalItemId: 'MLA1', externalVariationId: '10' },
            { id: 2, externalItemId: 'MLA1', externalVariationId: '20' },
        ],
        [
            { meliItemId: 'MLA1', variationId: '20' },
            { meliItemId: 'MLA2', variationId: null },
        ]
    );

    assert.deepEqual(plan.matches, [{ existingId: 2, desiredIndex: 0 }]);
    assert.deepEqual(plan.insertIndexes, [1]);
    assert.deepEqual(plan.staleExistingIds, [1]);
});

test('empareja líneas repetidas una sola vez', () => {
    const plan = planOrderItemSync(
        [
            { id: 1, externalItemId: 'MLA1', externalVariationId: null },
            { id: 2, externalItemId: 'MLA1', externalVariationId: null },
        ],
        [{ meliItemId: 'MLA1' }]
    );

    assert.deepEqual(plan.matches, [{ existingId: 1, desiredIndex: 0 }]);
    assert.deepEqual(plan.staleExistingIds, [2]);
});

test('distribuye el ingreso neto preservando el total exacto', () => {
    assert.deepEqual(allocateOrderLineRevenue(100, [1, 1, 1]), [33.33, 33.33, 33.34]);
});
