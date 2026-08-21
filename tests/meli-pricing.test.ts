import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMeliPrice, calculateNetReceived, getFixedCostForPrice } from '../src/lib/integrations/mercadolibre/pricing.ts';

const baseConfig = {
    commissionPct: 13,
    fixedCostThreshold1: 15_000,
    fixedCostAmount1: 1_115,
    fixedCostThreshold2: 25_000,
    fixedCostAmount2: 2_300,
    fixedCostThreshold3: 33_000,
    fixedCostAmount3: 2_810,
    freeShippingThreshold: 0,
    freeShippingCost: 0,
    extraMarginPct: 0,
    installmentsCostPct: 0,
    mpCommissionPct: 0,
    grossIncomeTaxPct: 0,
    roundingStrategy: 'round',
};

test('absorbe la comisión de ML sin reducir el ingreso objetivo de la app', () => {
    const price = calculateMeliPrice(100_000, baseConfig);
    assert.equal(price, 114_943);
    assert.ok(Math.abs(calculateNetReceived(price, baseConfig, 100_000) - 100_000) < 1);
});

test('aplica el cargo fijo correspondiente al rango de precio', () => {
    assert.equal(getFixedCostForPrice(10_000, baseConfig), 1_115);
    assert.equal(getFixedCostForPrice(20_000, baseConfig), 2_300);
    assert.equal(getFixedCostForPrice(30_000, baseConfig), 2_810);
    assert.equal(getFixedCostForPrice(100_000, baseConfig), 0);
});

test('puede absorber por separado MP e Ingresos Brutos', () => {
    const config = { ...baseConfig, mpCommissionPct: 2, grossIncomeTaxPct: 3 };
    const price = calculateMeliPrice(100_000, config);
    assert.equal(price, 121_951);
    assert.ok(Math.abs(calculateNetReceived(price, config, 100_000) - 100_000) < 1);
});
