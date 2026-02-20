import type { APIRoute } from 'astro';
import { OrderService } from '@/lib/services/OrderService';

export const POST: APIRoute = async (context) => {
    // Solo permitir en desarrollo
    if (import.meta.env.PROD) {
        return new Response(JSON.stringify({ error: 'No permitido en producción' }), { status: 403 });
    }

    try {
        const body = await context.request.json();
        const { items, shippingData, total, subtotal, paymentMethod, notes } = body;

        const result = await OrderService.createOrderFromCheckout({
            items,
            shippingData,
            total,
            subtotal,
            userId: context.locals.user?.id || null,
            paymentMethod: paymentMethod || 'mock_payment',
            paymentId: `MOCK-${Date.now()}`,
            notes: notes || 'PAGO SIMULADO (Local Debug)'
        });

        return new Response(JSON.stringify(result), { status: 201 });

    } catch (e: any) {
        console.error('Error en Mock Payment:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
