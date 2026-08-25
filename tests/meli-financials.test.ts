import test from 'node:test';
import assert from 'node:assert/strict';
import {
    allocateMoney,
    getEstimatedShippingCost,
    getLineSaleFeeTotal,
    getOrderMarketplaceFee,
    getSellerShippingCost,
} from '../src/lib/integrations/mercadolibre/financials.ts';

test('multiplica sale_fee por la cantidad vendida', () => {
    assert.equal(getLineSaleFeeTotal({ sale_fee: 1_250.25, quantity: 3 }), 3_750.75);
});

test('prioriza marketplace_fee como total autoritativo de la orden', () => {
    assert.equal(getOrderMarketplaceFee({
        marketplace_fee: 4_100,
        order_items: [{ sale_fee: 1_250, quantity: 3 }],
    }), 4_100);
});

test('suma sale_fee por unidad como respaldo cuando falta marketplace_fee', () => {
    assert.equal(getOrderMarketplaceFee({
        order_items: [
            { sale_fee: 1_250, quantity: 3 },
            { sale_fee: 800, quantity: 2 },
        ],
    }), 5_350);
});

test('lee seller.cost y sólo estima envío cuando corresponde por umbral', () => {
    assert.equal(getSellerShippingCost({ seller: { cost: 4_876.45 } }), 4_876.45);
    assert.equal(getSellerShippingCost({ seller: {} }), null);
    assert.equal(getEstimatedShippingCost(50_000, {
        freeShippingThreshold: 30_000,
        freeShippingCost: 5_000,
    }), 5_000);
    assert.equal(getEstimatedShippingCost(20_000, {
        freeShippingThreshold: 30_000,
        freeShippingCost: 5_000,
    }), 0);
});

test('distribuye importes preservando exactamente los centavos', () => {
    const allocations = allocateMoney(100, [1, 1, 1]);
    assert.deepEqual(allocations, [33.33, 33.33, 33.34]);
    assert.equal(allocations.reduce((sum, amount) => sum + amount, 0), 100);
});
