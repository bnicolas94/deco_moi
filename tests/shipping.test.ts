import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeArgentinePostalCode } from '../src/lib/shipping/postalCode.ts';

test('normaliza códigos postales argentinos numéricos y CPA', () => {
    assert.equal(normalizeArgentinePostalCode('1414'), '1414');
    assert.equal(normalizeArgentinePostalCode('C1414ABC'), '1414');
    assert.equal(normalizeArgentinePostalCode(' b 1900 '), '1900');
});

test('rechaza códigos postales incompletos o con caracteres inválidos', () => {
    assert.equal(normalizeArgentinePostalCode('123'), null);
    assert.equal(normalizeArgentinePostalCode('C14145ABC'), null);
    assert.equal(normalizeArgentinePostalCode('14-14'), null);
});
