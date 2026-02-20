import { db } from '@/lib/db/connection';
import { orders, orderItems, costItems, productCostItems, orderItemCosts } from '@/lib/db/schema';
import { OrderStatus, PaymentStatus } from '@/types/order';
import { inArray, eq, and } from 'drizzle-orm';

export interface CreateOrderData {
    items: any[];
    shippingData: any;
    total: number;
    subtotal: number;
    userId: string | null;
    paymentMethod: string;
    paymentId?: string;
    notes?: string;
}

export class OrderService {
    static async createOrderFromCheckout(data: CreateOrderData) {
        const { items, shippingData, total, subtotal, userId, paymentMethod, paymentId, notes } = data;

        // Generar número de orden
        const orderNumber = `DEC-${Math.floor(100000 + Math.random() * 900000)}`;

        // 1. Crear la Orden
        const [newOrder] = await db.insert(orders).values({
            id: crypto.randomUUID(),
            orderNumber,
            userId,
            status: OrderStatus.PENDING, // Siempre inicia como Pendiente para gestión interna de Deco Moi
            subtotal: String(subtotal),
            total: String(total),
            discountAmount: "0",
            shippingCost: "0",
            paymentMethod: paymentMethod as any,
            paymentStatus: PaymentStatus.APPROVED,
            shippingData,
            notes: notes || `Pago ${paymentMethod} ${paymentId ? '#' + paymentId : ''} procesado.`,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // 2. Crear los ítems
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
        }));

        const insertedItems = await db.insert(orderItems).values(itemsToInsert).returning();

        // 3. Capturar Costos de Productos
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
                const linkedPcosts = activeCosts.filter(c => c.productId === oi.productId && c.isActive).map(c => ({ name: c.name, type: c.type, value: c.value }));
                const gCosts = globalCosts.map(g => ({ name: g.name, type: g.type, value: g.value }));

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
                        calculatedAmount = Number(oi.unitPrice) * (configuredValue / 100) * oi.quantity;
                    } else {
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

        return {
            success: true,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber
        };
    }
}
