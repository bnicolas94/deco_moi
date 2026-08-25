import type { APIRoute } from 'astro';
import { enqueueOrderWebhook, MeliWebhookValidationError } from '../../../lib/integrations/mercadolibre/webhooks';
import { MeliOrderImportQueueService } from '../../../lib/services/MeliOrderImportQueueService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const payload = await request.json();

        if (payload.topic !== 'orders_v2') {
            return new Response(JSON.stringify({ received: true, ignored: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await enqueueOrderWebhook(payload);

        // Best effort inmediato. La cola y el cron conservan el trabajo si el proceso se interrumpe.
        setTimeout(() => {
            void MeliOrderImportQueueService.processPending(1).catch(error => {
                console.error('[Meli Webhook] Falló el procesamiento inmediato de la cola:', error);
            });
        }, 0);

        return new Response(JSON.stringify({ received: true, queued: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        if (err instanceof MeliWebhookValidationError) {
            console.warn('[Meli Webhook] Notificación ignorada:', err.message);
            return new Response(JSON.stringify({ received: true, ignored: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.error('[Meli Webhook] Error al recibir webhook:', err);
        // Si no pudimos persistir la notificación, pedimos un reintento a Mercado Libre.
        return new Response(JSON.stringify({ error: 'notification_not_queued' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
