import { db } from '@/lib/db/connection';
import { orders, orderItems, payments } from '@/lib/db/schema';
import { OrderStatus, PaymentStatus } from '@/types/order';
import { CostSnapshotService } from './CostSnapshotService';

export interface CreateOrderData {
    items: any[];
    shippingData: any;
    shippingMethod: 'pickup' | 'delivery';
    total: number;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    userId: string | null;
    paymentMethod: string;
    paymentId?: string;
    notes?: string;
}

export class OrderService {
    static async createOrderFromCheckout(data: CreateOrderData) {
        const {
            items,
            shippingData,
            shippingMethod,
            total,
            subtotal,
            discountAmount,
            shippingCost,
            userId,
            paymentMethod,
            paymentId,
            notes,
        } = data;

        // Generar número de orden
        const orderNumber = `DEC-${Math.floor(100000 + Math.random() * 900000)}`;

        // 1. Crear la Orden
        const initialPaymentStatus = paymentMethod === 'transfer' ? PaymentStatus.PENDING_TRANSFER : PaymentStatus.APPROVED;

        const [newOrder] = await db.insert(orders).values({
            id: crypto.randomUUID(),
            orderNumber,
            userId,
            status: OrderStatus.PENDING, // Siempre inicia como Pendiente para gestión interna de Deco Moi
            subtotal: String(subtotal),
            total: String(total),
            discountAmount: String(discountAmount),
            shippingCost: String(shippingCost),
            paymentMethod: paymentMethod as any,
            paymentStatus: initialPaymentStatus,
            salesChannel: 'app',
            financialStatus: 'provisional',
            paidAt: initialPaymentStatus === PaymentStatus.APPROVED ? new Date() : null,
            shippingData,
            shippingMethod,
            notes: notes || `Pago ${paymentMethod} ${paymentId ? '#' + paymentId : ''} procesado.`,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // 2. Crear los ítems
        const itemsSubtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
        let allocatedDiscount = 0;
        const itemsToInsert = items.map((item: any, index: number) => {
            const customization = {
                ...(item.customization ? { text: item.customization } : {}),
                ...(item.selectedOptions && item.selectedOptions.length > 0 ? { selectedOptions: item.selectedOptions } : {}),
            };

            const itemGross = Number(item.price) * Number(item.quantity);
            const itemDiscount = index === items.length - 1
                ? Number(discountAmount) - allocatedDiscount
                : (itemsSubtotal > 0 ? Math.round((Number(discountAmount) * itemGross / itemsSubtotal) * 100) / 100 : 0);
            allocatedDiscount += itemDiscount;

            return {
                orderId: newOrder.id,
                productId: item.id,
                productName: item.name,
                productSku: item.sku,
                quantity: item.quantity,
                unitPrice: String(item.price),
                subtotal: String(itemGross),
                customization: Object.keys(customization).length > 0 ? customization : null,
                variantId: item.variantId || null,
                productionTime: item.productionTime || null,
                packQuantity: 1,
                internalUnits: item.quantity,
                grossAmount: String(itemGross),
                discountAmount: String(itemDiscount),
                netRevenue: String(itemGross - itemDiscount),
            };
        });

        const insertedItems = await db.insert(orderItems).values(itemsToInsert).returning();

        // 3. Congelar costos configurados e insumos al momento de la venta.
        await CostSnapshotService.replaceConfiguredCosts(insertedItems, 'app');

        // 4. Registrar Pago (para idempotencia)
        if (paymentId) {
            await db.insert(payments).values({
                orderId: newOrder.id,
                method: paymentMethod,
                status: PaymentStatus.APPROVED,
                amount: String(total),
                transactionId: paymentId,
                metadata: { notes }
            });
        }

        return {
            success: true,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber
        };
    }
}
