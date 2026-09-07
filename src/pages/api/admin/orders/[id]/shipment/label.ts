import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { orders } from '@/lib/db/schema';
import { downloadShipmentDocument } from '@/lib/services/ShippingService';

export const GET: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, context.params.id || '')).limit(1);
    if (!order) return new Response(JSON.stringify({ error: 'Orden no encontrada' }), { status: 404 });
    if (!order.zipnovaShipmentId) {
        return new Response(JSON.stringify({ error: 'Primero tenés que generar el despacho' }), { status: 409 });
    }

    try {
        const document = await downloadShipmentDocument(order.zipnovaShipmentId, 'label', 'pdf');
        const filename = `etiqueta-${order.orderNumber.replace(/[^a-z0-9-]/gi, '-')}.pdf`;
        const body = document.bytes.buffer.slice(
            document.bytes.byteOffset,
            document.bytes.byteOffset + document.bytes.byteLength,
        ) as ArrayBuffer;
        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': document.contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error) {
        console.error('[Admin shipment label] Error:', error);
        const rawMessage = error instanceof Error ? error.message : '';
        const isPending = /shipping label not available|documento de despacho no disponible:\s*409/i.test(rawMessage);
        return new Response(JSON.stringify({
            code: isPending ? 'label_not_available' : 'shipment_document_error',
            error: isPending
                ? 'La etiqueta todavía no está disponible. Revisá el saldo de Zipnova y presioná Actualizar cuando la cuenta esté habilitada.'
                : rawMessage || 'No se pudo descargar la etiqueta',
        }), { status: isPending ? 409 : 502, headers: { 'Content-Type': 'application/json' } });
    }
};
