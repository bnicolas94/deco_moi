import { db } from '@/lib/db/connection';
import { orders, orderItems } from '@/lib/db/schema';
import { OrderStatus, PaymentStatus } from '@/types/order';

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

        await db.insert(orderItems).values(itemsToInsert);

        return {
            success: true,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber
        };
    }
}
