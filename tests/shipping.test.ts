import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupArgentinePostalCode, normalizeArgentinePostalCode } from '../src/lib/shipping/postalCode.ts';
import { normalizeZipnovaQuoteResult } from '../src/lib/shipping/zipnovaQuote.ts';
import { recoverShippingSelection } from '../src/lib/shipping/recoverSelection.ts';

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

test('resuelve Wilde y otras localidades desde la referencia postal local', () => {
    assert.deepEqual(lookupArgentinePostalCode('1875'), {
        city: 'Wilde',
        state: 'Buenos Aires',
        postalCode: '1875',
    });
    assert.equal(lookupArgentinePostalCode('0000'), null);
});

test('conserva logistic_type cuando Zipnova lo devuelve como texto', () => {
    const [quote] = normalizeZipnovaQuoteResult({
        logistic_type: 'carrier_dropoff',
        service_type: { id: 1, code: 'standard_delivery', name: 'Entrega a domicilio' },
        carrier: { id: 233, name: 'Correo Argentino' },
        amounts: { price_incl_tax: 14650 },
        delivery_time: { estimated_delivery: '2026-09-18' },
    });

    assert.equal(quote.logisticType, 'carrier_dropoff');
    assert.equal(quote.serviceType, 'standard_delivery');
    assert.equal(quote.carrierId, 233);
    assert.equal(quote.id, 'zipnova_233_standard_delivery_carrier_dropoff');
});

test('recupera una selección histórica sin logistic_type y conserva el precio cobrado', () => {
    const [freshQuote] = normalizeZipnovaQuoteResult({
        logistic_type: 'carrier_dropoff',
        service_type: { code: 'standard_delivery', name: 'Entrega a domicilio' },
        carrier: { id: 233, name: 'Correo Argentino' },
        amounts: { price_incl_tax: 15000 },
    });
    const recovered = recoverShippingSelection({
        carrierId: 233,
        serviceType: 'standard_delivery',
        serviceTypeName: 'Entrega a domicilio',
        logisticType: '',
        price: 14650,
    }, [freshQuote], 14650);

    assert.equal(recovered?.logisticType, 'carrier_dropoff');
    assert.equal(recovered?.price, 14650);
});
