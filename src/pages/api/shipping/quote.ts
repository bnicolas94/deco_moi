import type { APIRoute } from 'astro';
import { quoteShipment, getShippingConfig } from '@/lib/services/ShippingService';
import type { ShippingQuoteItem, ShippingDestination } from '@/lib/services/ShippingService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { items, destination, declaredValue } = body as {
            items: ShippingQuoteItem[];
            destination: ShippingDestination;
            declaredValue: number;
        };

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No se proporcionaron items para cotizar' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!destination || !destination.zipcode) {
            return new Response(JSON.stringify({ error: 'Se requiere un código postal de destino' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const config = await getShippingConfig();

        // Verificar si aplica envío gratis
        if (config.freeShippingEnabled && declaredValue >= config.freeShippingThreshold) {
            return new Response(JSON.stringify({
                results: [{
                    id: 'free_shipping',
                    serviceType: 'free_shipping',
                    serviceTypeName: 'Envío gratis',
                    logisticType: 'free',
                    logisticTypeName: 'Envío gratis',
                    carrierName: 'Envío gratis',
                    carrierId: 0,
                    price: 0,
                    priceInclTax: 0,
                    estimatedDelivery: '',
                    deliveryTimeHours: null,
                }],
                freeShipping: true,
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const results = await quoteShipment(items, destination, declaredValue);

        return new Response(JSON.stringify({ results, freeShipping: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error al cotizar envío:', error);
        return new Response(JSON.stringify({ error: 'Error al cotizar el envío' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
