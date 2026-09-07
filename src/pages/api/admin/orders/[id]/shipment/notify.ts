import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { orders } from '@/lib/db/schema';
import { EmailService } from '@/lib/services/EmailService';
import { getShipment } from '@/lib/services/ShippingService';
import { getZipnovaLabelState, normalizeZipnovaShipment } from '@/lib/shipping/zipnovaShipment';

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') return json({ error: 'No autorizado' }, 401);

    const [order] = await db.select().from(orders).where(eq(orders.id, context.params.id || '')).limit(1);
    if (!order) return json({ error: 'Orden no encontrada' }, 404);
    if (!order.zipnovaShipmentId) return json({ error: 'Primero tenés que generar el despacho' }, 409);

    try {
        const freshShipment = normalizeZipnovaShipment(await getShipment(order.zipnovaShipmentId));
        const previousShipment = (order.shippingData as any)?.zipnovaShipment || {};
        const zipnovaShipment = { ...previousShipment, ...freshShipment };
        const shippingData = { ...(order.shippingData || {}), zipnovaShipment };
        await db.update(orders).set({ shippingData, updatedAt: new Date() }).where(eq(orders.id, order.id));

        const labelState = getZipnovaLabelState(freshShipment);
        if (!labelState.ready) return json({ error: labelState.message, code: labelState.code }, 409);

        const sent = await EmailService.sendShipmentUpdateEmail(order.id);
        if (!sent) return json({ error: 'No pudimos enviar el email. Verificá que la orden tenga un correo válido.' }, 502);

        const notifiedAt = new Date().toISOString();
        await db.update(orders).set({
            shippingData: {
                ...shippingData,
                zipnovaShipment: { ...zipnovaShipment, customerNotifiedAt: notifiedAt },
            },
            updatedAt: new Date(),
        }).where(eq(orders.id, order.id));

        return json({ sent: true, notifiedAt });
    } catch (error) {
        console.error('[Admin shipment notify] Error:', error);
        return json({ error: error instanceof Error ? error.message : 'No se pudo avisar al comprador' }, 502);
    }
};
