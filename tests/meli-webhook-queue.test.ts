import assert from 'node:assert/strict';
import test from 'node:test';
import { extractMeliOrderId, getImportRetryDelayMs } from '../src/lib/integrations/mercadolibre/webhook-queue.ts';

test('extrae únicamente recursos válidos de órdenes', () => {
    assert.equal(extractMeliOrderId('/orders/123456789'), '123456789');
    assert.equal(extractMeliOrderId('/orders/123/extra'), null);
    assert.equal(extractMeliOrderId('/items/123'), null);
    assert.equal(extractMeliOrderId(undefined), null);
});

test('aplica reintentos crecientes y acotados', () => {
    assert.equal(getImportRetryDelayMs(1), 60_000);
    assert.equal(getImportRetryDelayMs(2), 5 * 60_000);
    assert.equal(getImportRetryDelayMs(8), 12 * 60 * 60_000);
    assert.equal(getImportRetryDelayMs(99), 12 * 60 * 60_000);
});
