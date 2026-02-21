import type { APIRoute } from 'astro';
import { MeliService } from '../../../lib/services/MeliService';

export const POST: APIRoute = async () => {
    try {
        const result = await MeliService.importRecentOrders();

        return new Response(JSON.stringify({
            success: true,
            data: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('[Meli API] Error importing orders', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
