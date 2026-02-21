import type { APIRoute } from 'astro';
import { MeliService } from '../../../lib/services/MeliService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        if (!body.productId) {
            return new Response(JSON.stringify({ success: false, error: 'productId is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await MeliService.syncStock(Number(body.productId));

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('[Meli API] Error syncing stock', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
