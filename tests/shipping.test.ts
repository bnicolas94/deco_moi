import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupArgentinePostalCode, normalizeArgentinePostalCode } from '../src/lib/shipping/postalCode.ts';
import { normalizeZipnovaQuoteResult } from '../src/lib/shipping/zipnovaQuote.ts';
import { recoverShippingSelection } from '../src/lib/shipping/recoverSelection.ts';
import { formatIsoDuration, getZipnovaLabelState, normalizeZipnovaShipment } from '../src/lib/shipping/zipnovaShipment.ts';
import { ClientOrderConfirmationTemplate } from '../src/emails/ClientOrderConfirmation.ts';

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
        delivery_time: {
            estimated_delivery: '2026-09-18',
            estimation_expires_at: '2026-09-08',
            times: { preparation: 'P2D', shipping: 'P4D', total: 'P6D' },
        },
    });

    assert.equal(quote.logisticType, 'carrier_dropoff');
    assert.equal(quote.serviceType, 'standard_delivery');
    assert.equal(quote.carrierId, 233);
    assert.equal(quote.id, 'zipnova_233_standard_delivery_carrier_dropoff');
    assert.equal(quote.preparationTime, 'P2D');
    assert.equal(quote.shippingTime, 'P4D');
    assert.equal(quote.totalTime, 'P6D');
    assert.equal(quote.quotedEstimatedDelivery, '2026-09-18');
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
    assert.equal(recovered?.quotedEstimatedDelivery, freshQuote.estimatedDelivery);
});

test('conserva la fecha prometida aunque Zipnova recalcule el despacho', () => {
    const [freshQuote] = normalizeZipnovaQuoteResult({
        logistic_type: 'carrier_dropoff',
        service_type: { code: 'standard_delivery', name: 'Entrega a domicilio' },
        carrier: { id: 233, name: 'Correo Argentino' },
        amounts: { price_incl_tax: 14650 },
        delivery_time: { estimated_delivery: '2026-09-21T23:59:00Z' },
    });
    const recovered = recoverShippingSelection({
        carrierId: 233,
        serviceType: 'standard_delivery',
        estimatedDelivery: '2026-09-18T23:59:00Z',
        price: 14650,
    }, [freshQuote], 14650);

    assert.equal(recovered?.quotedEstimatedDelivery, '2026-09-18T23:59:00Z');
    assert.equal(recovered?.estimatedDelivery, '2026-09-21T23:59:00Z');
});

test('bloquea la etiqueta si Zipnova permanece procesando y la habilita con documentación lista', () => {
    const processing = normalizeZipnovaShipment({
        id: 29908847,
        status: 'new',
        status_name: 'Procesando',
        created_at: '2026-09-07T18:53:00-03:00',
        delivery_time: {
            estimated_delivery: '2026-09-21T23:59:00Z',
            dropoff_deadline_at: '2026-09-15T21:00:00Z',
            times: { preparation: 'P6DT12H', carrier: 'P4D', total: 'P10DT12H' },
        },
    });
    const state = getZipnovaLabelState(processing, new Date('2026-09-07T19:00:00-03:00'));

    assert.equal(processing.labelReady, false);
    assert.equal(processing.preparationTime, 'P6DT12H');
    assert.equal(state.code, 'account_action_required');
    assert.match(state.message || '', /saldo/i);

    const ready = normalizeZipnovaShipment({ id: 1, status: 'documentation_ready' });
    assert.equal(getZipnovaLabelState(ready).ready, true);
    assert.equal(formatIsoDuration('P6DT12H'), '6 días 12 h');
});

test('el email del comprador usa los campos reales de checkout sin mostrar undefined', () => {
    const html = ClientOrderConfirmationTemplate({
        order: {
            orderNumber: 'DEC-TEST',
            createdAt: '2026-09-07T12:00:00Z',
            paymentMethod: 'mercadopago',
            paymentStatus: 'approved',
            shippingMethod: 'delivery',
            subtotal: 100000,
            discountAmount: 0,
            shippingCost: 14650,
            total: 114650,
            shippingData: {
                street: 'Lincoln',
                number: '1242',
                city: 'Wilde',
                state: 'Buenos Aires',
                postal_code: '1875',
                selectedShipping: {
                    carrierName: 'Correo Argentino',
                    serviceTypeName: 'Entrega a domicilio',
                    estimatedDelivery: '2026-09-21T23:59:00Z',
                },
            },
        },
        items: [{ productName: 'Cajita Classic', quantity: 1, unitPrice: 100000, subtotal: 100000 }],
        customer: { name: 'Cliente' },
    });

    assert.doesNotMatch(html, /undefined/i);
    assert.match(html, /Lincoln 1242, Wilde, Buenos Aires, CP 1875/);
    assert.match(html, /Correo Argentino/);
    assert.match(html, /21 de septiembre de 2026/);
});
