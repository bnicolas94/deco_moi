import type { APIRoute } from 'astro';
import { processOrderWebhook } from '../../../lib/integrations/mercadolibre/webhooks';
import { MeliService } from '../../../lib/services/MeliService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const payload = await request.json();

        // Solo procesamos eventos de órdenes creadas/modificadas
        if (payload.topic === 'orders_v2') {
            try {
                await processOrderWebhook(payload);

                // Importar la orden usando el order_id que viene en el resource
                const orderIdMatch = payload.resource?.match(/\/orders\/(\d+)/);
                if (orderIdMatch && orderIdMatch[1]) {
                    await MeliService.importOrder(orderIdMatch[1]);
                }
            } catch (innerErr) {
                console.error('[Meli Webhook] Error interno procesando webhook:', innerErr);
                // Aun si falla nuestra logica, ML requiere un 200 OK, sino reintenta enviar miles de veces
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[Meli Webhook] Error al recibir webhook:', err);
        // Errores de parseo u otros => retornamos 200 igual para que ML no reintente locamente
        return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 200 });
    }
};
