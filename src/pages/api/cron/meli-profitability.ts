import type { APIRoute } from 'astro';
import { verifyBearerSecret } from '@/lib/security/request';
import { MeliOrderImportQueueService } from '@/lib/services/MeliOrderImportQueueService';

export const GET: APIRoute = async ({ request }) => {
    const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';
    if (!cronSecret) return new Response('Servicio no configurado', { status: 503 });
    if (!verifyBearerSecret(request.headers.get('authorization'), cronSecret)) {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const result = await MeliOrderImportQueueService.processPending(20);
        return new Response(JSON.stringify({ success: result.failed === 0, data: result }), {
            status: result.failed === 0 ? 200 : 207,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[Meli Profitability Cron] Error procesando cola:', error);
        return new Response(JSON.stringify({ success: false, error: 'queue_processing_failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
