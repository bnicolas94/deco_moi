import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { orders, orderItems, costItems, productCostItems, orderItemCosts } from '@/lib/db/schema';
import { OrderStatus, PaymentStatus } from '@/types/order';
import { inArray, eq, and } from 'drizzle-orm';

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

        const insertedItems = await db.insert(orderItems).values(itemsToInsert).returning();

        // 3. Capturar Costos de Productos (Análisis de Rentabilidad)
        const productIds = itemsToInsert.map((i: any) => i.productId);
        if (productIds.length > 0) {
            const activeCosts = await db.select({
                productId: productCostItems.productId,
                name: costItems.name,
                type: costItems.type,
                value: costItems.value,
                isActive: costItems.isActive
            })
                .from(productCostItems)
                .innerJoin(costItems, eq(productCostItems.costItemId, costItems.id))
                .where(inArray(productCostItems.productId, productIds));

            const globalCosts = await db.select().from(costItems).where(
                and(
                    eq(costItems.isActive, true),
                    eq(costItems.isGlobal, true)
                )
            );

            const costsToInsert: any[] = [];
            for (const oi of insertedItems) {
                // Solo items activos
                const linkedPcosts = activeCosts.filter(c => c.productId === oi.productId && c.isActive).map(c => ({ name: c.name, type: c.type, value: c.value }));
                const gCosts = globalCosts.map(g => ({ name: g.name, type: g.type, value: g.value }));

                // Combinar ambos removiendo duplicados si por error asignaron uno global manualmente al producto
                const allPcosts = [...linkedPcosts];
                gCosts.forEach(gc => {
                    if (!allPcosts.some(p => p.name === gc.name)) {
                        allPcosts.push(gc);
                    }
                });

                for (const pc of allPcosts) {
                    const configuredValue = Number(pc.value);
                    let calculatedAmount = 0;
                    if (pc.type === 'percentage') {
                        // Porcentaje sobre el precio unitario x cantidad
                        calculatedAmount = Number(oi.unitPrice) * (configuredValue / 100) * oi.quantity;
                    } else {
                        // Monto fijo x cantidad
                        calculatedAmount = configuredValue * oi.quantity;
                    }
                    costsToInsert.push({
                        orderItemId: oi.id,
                        costItemName: pc.name,
                        costItemType: pc.type,
                        configuredValue: String(configuredValue),
                        calculatedAmount: String(calculatedAmount)
                    });
                }
            }
            if (costsToInsert.length > 0) {
                await db.insert(orderItemCosts).values(costsToInsert);
            }
        }

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
