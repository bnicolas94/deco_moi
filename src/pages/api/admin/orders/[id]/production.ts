import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { orders } from '@/lib/db/schema';
import { buildFulfillmentSnapshot } from '@/lib/shipping/productionLeadTime';

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return json({ error: 'No autorizado' }, 401);
    }

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, context.params.id || ''),
    });
    if (!order) return json({ error: 'Orden no encontrada' }, 404);
    if (order.status === 'cancelled') return json({ error: 'No se puede modificar una orden cancelada.' }, 409);
    if (order.paymentStatus !== 'approved') return json({ error: 'Confirmá el pago antes de iniciar la elaboración.' }, 409);

    let body: Record<string, unknown> = {};
    try {
        body = await context.request.json();
    } catch {
        return json({ error: 'Solicitud inválida' }, 400);
    }
    if (body.action !== 'ready' && body.action !== 'resume') {
        return json({ error: 'Acción de producción inválida' }, 400);
    }

    const now = new Date();
    const shipping = (order.shippingData || {}) as Record<string, any>;
    const current = shipping.fulfillment || buildFulfillmentSnapshot(
        shipping.selectedShipping,
        true,
        order.paidAt || order.createdAt || now,
    );
    const fulfillment = body.action === 'ready'
        ? { ...current, status: 'ready_for_dispatch', productionReadyAt: now.toISOString() }
        : { ...current, status: 'in_production', productionReadyAt: null };

    await db.update(orders).set({
        shippingData: { ...shipping, fulfillment },
        status: ['pending', 'confirmed'].includes(order.status) ? 'processing' : order.status,
        updatedAt: now,
    }).where(eq(orders.id, order.id));

    return json({ success: true, fulfillment });
};
