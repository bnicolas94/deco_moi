import assert from 'node:assert/strict';
import test from 'node:test';
import {
    classifyBillingDetail,
    getBillingDetailAmount,
    getBillingDetailItemIds,
    groupBillingDetailsByOrder,
} from '../src/lib/integrations/mercadolibre/billing.ts';

test('desenvuelve results[].details y agrupa por order_id', () => {
    const details = groupBillingDetailsByOrder({
        results: [
            {
                order_id: 123,
                details: [
                    { charge_info: { detail_id: 10, detail_amount: 100, detail_type: 'CHARGE' } },
                    { charge_info: { detail_id: 11, detail_amount: 20, detail_type: 'BONUS' } },
                ],
            },
            {
                order_id: 456,
                details: [{ charge_info: { detail_id: 12, detail_amount: 30, detail_type: 'CHARGE' } }],
            },
        ],
    });

    assert.equal(details.get('123')?.length, 2);
    assert.equal(details.get('456')?.length, 1);
});

test('no duplica el mismo detail_id dentro de una orden', () => {
    const detail = { charge_info: { detail_id: 10, detail_amount: 100, detail_type: 'CHARGE' } };
    const details = groupBillingDetailsByOrder({
        results: [{ order_id: 123, details: [detail, detail] }],
    });

    assert.equal(details.get('123')?.length, 1);
});

test('usa items_info para relacionar el cargo con los anuncios de la orden', () => {
    const itemIds = getBillingDetailItemIds({
        items_info: [
            { order_id: 123, item_id: 'MLA1' },
            { order_id: 123, item_id: 'MLA2' },
            { order_id: 999, item_id: 'MLA3' },
        ],
    }, '123');

    assert.deepEqual(itemIds, ['MLA1', 'MLA2']);
});

test('clasifica cargos y bonificaciones de venta y envío en la misma categoría', () => {
    assert.equal(classifyBillingDetail('Cargo por venta', 'CV'), 'marketplace_fee');
    assert.equal(classifyBillingDetail('Bonificación', 'BV'), 'marketplace_fee');
    assert.equal(classifyBillingDetail('Cargo por Mercado Envíos', 'CXD'), 'shipping_fee');
    assert.equal(classifyBillingDetail('Bonificación por Mercado Envíos', 'BXD'), 'shipping_fee');
    assert.equal(classifyBillingDetail('Tarifa de financiación', 'CFONPN'), 'payment_fee');
});

test('representa BONUS como costo negativo y CHARGE como costo positivo', () => {
    assert.equal(getBillingDetailAmount({ charge_info: { detail_amount: 50.25, detail_type: 'CHARGE' } }), 50.25);
    assert.equal(getBillingDetailAmount({ charge_info: { detail_amount: 12.5, detail_type: 'BONUS' } }), -12.5);
});
