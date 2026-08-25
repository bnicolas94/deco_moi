import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculateMarketplaceStock,
    getMeliVariationSku,
    normalizePackQuantity,
    resolveVariationStockSource,
} from '../src/lib/integrations/mercadolibre/stock.ts';

const sources = [
    { id: 1, sku: 'PRODUCTO-1', stock: 100, source: 'product' as const },
    { id: 10, sku: 'ROJO-M', stock: 27, source: 'product_variant' as const },
];

test('publica sólo los packs completos disponibles', () => {
    assert.equal(calculateMarketplaceStock(27, 5), 5);
    assert.equal(calculateMarketplaceStock(3, 5), 0);
    assert.equal(calculateMarketplaceStock(-2, 1), 0);
});

test('rechaza cantidades de pack inválidas', () => {
    assert.throws(() => normalizePackQuantity(0), /mayor o igual a 1/);
    assert.throws(() => normalizePackQuantity(1.5), /número entero/);
});

test('lee SELLER_SKU de los atributos de la variación', () => {
    const variation = { attributes: [{ id: 'SELLER_SKU', value_name: ' rojo-m ' }] };
    assert.equal(getMeliVariationSku(variation), 'ROJO-M');
    assert.equal(resolveVariationStockSource(variation, sources), sources[1]);
});

test('no confunde seller_custom_field con SELLER_SKU', () => {
    const variation = { seller_custom_field: 'ROJO-M', attributes: [] };
    assert.equal(getMeliVariationSku(variation), null);
    assert.throws(() => resolveVariationStockSource(variation, sources), /no tiene el atributo SELLER_SKU/);
});

test('rechaza SKUs ausentes o ambiguos sin inventar stock', () => {
    const variation = { attributes: [{ id: 'SELLER_SKU', value_name: 'ROJO-M' }] };
    assert.throws(
        () => resolveVariationStockSource(variation, [...sources, { id: 20, sku: 'rojo-m', stock: 8, source: 'variant_option' }]),
        /más de una fuente/
    );
    assert.throws(
        () => resolveVariationStockSource({ attributes: [{ id: 'SELLER_SKU', value_name: 'AZUL-L' }] }, sources),
        /No existe/
    );
});
