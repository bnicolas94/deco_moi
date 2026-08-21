import type { APIRoute } from 'astro';
import { BillingReconciliationService } from '@/lib/services/BillingReconciliationService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json().catch(() => ({}));
        const result = Array.isArray(body.orderIds) && body.orderIds.length > 0
            ? await BillingReconciliationService.reconcileOrders(body.orderIds.map(String))
            : await BillingReconciliationService.reconcilePendingOrders(Number(body.limit || 60));
        return new Response(JSON.stringify({ success: result.errors === 0, data: result }), {
            status: result.errors === 0 ? 200 : 502,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
