import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/EmailService';

export const PUT: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const id = context.params.id!;
    const body = await context.request.json();

    try {
        const currentOrderResult = await db.select().from(orders).where(eq(orders.id, id));
        if (!currentOrderResult.length) return new Response(JSON.stringify({ error: 'Orden no encontrada' }), { status: 404 });
        const currentOrder = currentOrderResult[0];

        await db.update(orders)
            .set({
                status: body.status,
                paymentStatus: body.paymentStatus,
                updatedAt: new Date()
            })
            .where(eq(orders.id, id));

        // Si el estado de pago cambió a 'approved' manualmente, enviar emails
        if (currentOrder.paymentStatus !== 'approved' && body.paymentStatus === 'approved') {
            EmailService.sendOrderConfirmationEmails(id).catch(err => {
                console.error('Error al iniciar envío de emails tras confirmación manual:', err);
            });
        }

        return new Response(JSON.stringify({ success: true, message: 'Orden actualizada correctamente' }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Error al actualizar orden' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async (context) => {
    console.log('API: Iniciando proceso de eliminación para orden:', context.params.id);

    if (!context.locals.user) {
        console.error('API: Usuario no autenticado');
        return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }

    if (context.locals.user.role !== 'admin') {
        console.error('API: Usuario no es administrador:', context.locals.user.role);
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const id = context.params.id!;

    try {
        // Primero borrar los items para evitar problemas de FK
        console.log('API: Borrando items de la orden:', id);
        await db.delete(orderItems)
            .where(eq(orderItems.orderId, id));

        console.log('API: Borrando la orden:', id);
        const result = await db.delete(orders)
            .where(eq(orders.id, id));

        console.log('API: Orden eliminada con éxito');
        return new Response(JSON.stringify({ success: true, message: 'Orden eliminada correctamente' }), { status: 200 });
    } catch (e: any) {
        console.error('API Error al eliminar orden:', e);
        return new Response(JSON.stringify({ error: 'Error al eliminar orden: ' + e.message }), { status: 500 });
    }
};
