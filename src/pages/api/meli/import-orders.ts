import type { APIRoute } from 'astro';
import { MeliService } from '../../../lib/services/MeliService';
import { BillingReconciliationService } from '../../../lib/services/BillingReconciliationService';

export const POST: APIRoute = async () => {
    try {
        const result = await MeliService.importRecentOrders();
        const reconciliation = await BillingReconciliationService.reconcilePendingOrders(60);

        return new Response(JSON.stringify({
            success: true,
            data: { ...result, reconciliation }
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
