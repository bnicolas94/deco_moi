import type { APIRoute } from 'astro';
import { preference } from '@/lib/mercadopago';
import {
    CheckoutValidationError,
    parseCheckoutRequest,
    validateCheckoutPayload,
} from '@/lib/services/CheckoutValidationService';

function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export const POST: APIRoute = async (context) => {
    try {
        const checkout = await validateCheckoutPayload(await parseCheckoutRequest(context.request));

        if (checkout.paymentMethod !== 'mercadopago') {
            throw new CheckoutValidationError('Método de pago inválido');
        }

        console.log('API: Iniciando creación de preferencia MP');

        // URL base del sitio desde .env (limpiando posibles comillas)
        let baseUrl = (import.meta.env.PUBLIC_URL || process.env.PUBLIC_URL || 'http://localhost:4321').replace(/"/g, '');

        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }

        // Todos los importes y datos de producto vienen de PostgreSQL, no del navegador.
        const mpItems = checkout.items.map((item) => {
            let pictureUrl = item.image;
            if (pictureUrl && !pictureUrl.startsWith('http')) {
                pictureUrl = `${baseUrl}${pictureUrl.startsWith('/') ? '' : '/'}${pictureUrl}`;
            }

            return {
                id: String(item.id),
                title: item.name,
                unit_price: item.price,
                quantity: item.quantity,
                currency_id: 'ARS',
                description: [
                    item.variantName || '',
                    ...item.selectedOptions.map((option) => `${option.groupName}: ${option.optionName}`),
                ].filter(Boolean).join(' | '),
                picture_url: pictureUrl || undefined,
            };
        });

        if (checkout.shippingCost > 0 && checkout.selectedShipping) {
            mpItems.push({
                id: 'shipping',
                title: `Envío - ${checkout.selectedShipping.carrierName}`,
                unit_price: checkout.shippingCost,
                quantity: 1,
                currency_id: 'ARS',
                description: checkout.selectedShipping.serviceTypeName || 'Envío a domicilio',
                picture_url: undefined,
            });
        }

        const trustedShippingData = {
            ...checkout.shippingData,
            selectedShipping: checkout.selectedShipping,
        };

        const result = await preference.create({
            body: {
                items: mpItems,
                back_urls: {
                    success: `${baseUrl}/checkout/success`,
                    failure: `${baseUrl}/checkout/failure`,
                    pending: `${baseUrl}/checkout/pending`,
                },
                auto_return: 'approved',
                notification_url: `${baseUrl}/api/checkout/webhook`,
                statement_descriptor: 'DECOMOI',
                metadata: {
                    shipping_data: JSON.stringify(trustedShippingData),
                    order_items: JSON.stringify(checkout.items.map(({ shippingItem: _shippingItem, ...item }) => item)),
                    total_amount: checkout.total,
                    subtotal_amount: checkout.subtotal,
                    discount_amount: checkout.discountAmount,
                    shipping_cost: checkout.shippingCost,
                    shipping_method: checkout.shippingMethod,
                    user_id: context.locals.user?.id || null,
                },
            },
        });

        console.log('API: Preferencia MP creada con ID:', result.id);

        return jsonResponse({ id: result.id, init_point: result.init_point }, 200);
    } catch (error) {
        if (error instanceof CheckoutValidationError) {
            return jsonResponse({ error: error.message }, error.status);
        }

        console.error('API Error creando preferencia MP:', error);
        return jsonResponse({ error: 'Error al iniciar el pago con Mercado Pago' }, 500);
    }
};
