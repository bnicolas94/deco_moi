import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { orders, orderItems } from '@/lib/db/schema';
import { OrderStatus, PaymentStatus } from '@/types/order';

export const POST: APIRoute = async (context) => {
    // En este proyecto parece que se permiten pedidos como invitado o usuario logueado
    // Si hay un usuario en context.locals, lo usamos
    const userId = context.locals.user?.id || null;

    try {
        const body = await context.request.json();
        const { items, shippingData, paymentMethod, notes, subtotal, total, discountAmount, shippingCost, shippingMethod, selectedShipping } = body;

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'El carrito está vacío' }), { status: 400 });
        }

        // Generar número de orden aleatorio
        const orderNumber = `DEC-${Math.floor(100000 + Math.random() * 900000)}`;

        // Combinar datos de envío con la opción seleccionada
        const fullShippingData = {
            ...shippingData,
            selectedShipping: selectedShipping || null,
        };

        // 1. Crear la Orden
        const [newOrder] = await db.insert(orders).values({
            id: crypto.randomUUID(),
            orderNumber,
            userId,
            status: OrderStatus.PENDING,
            subtotal: String(subtotal),
            total: String(total),
            discountAmount: String(discountAmount || 0),
            shippingCost: String(shippingCost || 0),
            paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            shippingData: fullShippingData,
            shippingMethod: shippingMethod || 'pickup',
            notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // 2. Crear los ítems de la orden
        const itemsToInsert = items.map((item: any) => ({
            orderId: newOrder.id,
            productId: item.id,
            productName: item.name,
            productSku: item.sku,
            quantity: item.quantity,
            unitPrice: String(item.price),
            subtotal: String(item.price * item.quantity),
            customization: item.customization ? { text: item.customization } : null,
            variantId: item.variantId || null,
            productionTime: item.productionTime || null,
        }));

        await db.insert(orderItems).values(itemsToInsert);

        return new Response(JSON.stringify({
            success: true,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber
        }), { status: 201 });

    } catch (e) {
        console.error('Error al crear orden:', e);
        return new Response(JSON.stringify({ error: 'Error al procesar el pedido' }), { status: 500 });
    }
};
