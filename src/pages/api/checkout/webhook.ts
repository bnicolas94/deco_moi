import type { APIRoute } from 'astro';
import { mpClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import { OrderService } from '@/lib/services/OrderService';
import { db } from '@/lib/db/connection';
import { payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/EmailService';

const MONEY_TOLERANCE = 0.01;

function parseMoney(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error('Importe inválido en metadata de Mercado Pago');
    }
    return parsed;
}

function parsePositiveInteger(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error('Cantidad inválida en metadata de Mercado Pago');
    }
    return parsed;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || url.searchParams.get('topic');
        const id = url.searchParams.get('data.id') || url.searchParams.get('id');

        console.log(`Webhook MP recibido: tipo=${type}, id=${id}`);

        // Solo procesamos pagos
        if (type === 'payment' && id) {
            try {
                // Verificar idempotencia: si el pago ya existe en la DB, ignoramos este Webhook
                const existingPayment = await db.query.payments.findFirst({
                    where: eq(payments.transactionId, id)
                });

                if (existingPayment) {
                    console.log(`Webhook MP: Pago ${id} ya procesado anteriormente. Ignorando.`);
                    return new Response(null, { status: 200 });
                }

                const payment = new Payment(mpClient);
                const paymentData = await payment.get({ id });

                console.log(`Estado del pago MP ${id}: ${paymentData.status}`);

                // Si el pago está aprobado, creamos la orden o matcheamos transferencia
                if (paymentData.status === 'approved') {
                    const metadata = paymentData.metadata;

                    if (!metadata) {
                        // Verifica si es una transferencia entrante directa (sin metadata de preference)
                        const isTransfer = paymentData.payment_type_id === 'bank_transfer' || paymentData.operation_type === 'account_fund' || paymentData.operation_type === 'money_transfer';

                        if (isTransfer) {
                            let senderDni = paymentData.payer?.identification?.number;
                            const amount = Number(paymentData.transaction_amount);

                            if (senderDni) {
                                // Limpieza de CUIL a DNI
                                if (senderDni.length === 11) {
                                    senderDni = senderDni.substring(2, 10);
                                }

                                const { orders, unmatchedTransfers } = await import('@/lib/db/schema');
                                const { PaymentStatus } = await import('@/types/order');
                                const minAmount = amount - 1;
                                const maxAmount = amount + 1;

                                const pendingOrders = await db.select().from(orders).where(eq(orders.paymentStatus, PaymentStatus.PENDING_TRANSFER));

                                let matchedOrder = null;
                                for (const order of pendingOrders) {
                                    const orderTotal = Number(order.total);
                                    if (orderTotal >= minAmount && orderTotal <= maxAmount) {
                                        const checkoutDni = order.shippingData?.transfer_dni;
                                        if (checkoutDni && checkoutDni.toString() === senderDni.toString()) {
                                            matchedOrder = order;
                                            break;
                                        }
                                    }
                                }

                                // 2. Fallback por Monto Único (Si MP no nos da el DNI real del emisor y solo hay una orden con ese monto)
                                if (!matchedOrder) {
                                    const ordersWithSameAmount = pendingOrders.filter(order => {
                                        const orderTotal = Number(order.total);
                                        return orderTotal >= minAmount && orderTotal <= maxAmount;
                                    });

                                    if (ordersWithSameAmount.length === 1) {
                                        matchedOrder = ordersWithSameAmount[0];
                                    }
                                }

                                if (matchedOrder) {
                                    await db.update(orders)
                                        .set({ paymentStatus: PaymentStatus.APPROVED, updatedAt: new Date() })
                                        .where(eq(orders.id, matchedOrder.id));

                                    await db.insert(payments).values({
                                        orderId: matchedOrder.id,
                                        method: 'mercadopago_transfer',
                                        status: PaymentStatus.APPROVED,
                                        amount: String(amount),
                                        transactionId: id,
                                        metadata: { notes: `Auto-detectado de MP (Webhook): DNI ${senderDni}` }
                                    });

                                    // Enviar email de confirmación de pago al cliente y notificación de venta al admin
                                    EmailService.sendPaymentConfirmedEmail(matchedOrder.id).catch(err => console.error(err));
                                    EmailService.sendOrderConfirmationEmails(matchedOrder.id, { skipClient: true }).catch(err => console.error(err));

                                    console.log(`Webhook: Transferencia matcheada con orden ${matchedOrder.orderNumber}`);
                                } else {
                                    // Guardar como no matcheada
                                    await db.insert(unmatchedTransfers).values({
                                        amount: String(amount),
                                        senderDni: senderDni,
                                        mpPaymentId: String(id),
                                        paymentDate: new Date(paymentData.date_created || Date.now()),
                                        rawMetadata: paymentData,
                                        status: 'pending_review'
                                    });
                                    EmailService.sendUnmatchedTransferAlert(amount, senderDni, String(id)).catch(err => console.error(err));
                                    console.log(`Webhook: Transferencia NO matcheada guardada. DNI ${senderDni}`);
                                }
                            }
                        } else {
                            console.error('No hay metadata en el pago de MP y no es transferencia.');
                        }

                        return new Response(null, { status: 200 });
                    }

                    // Flujo normal con preferences
                    const shippingData = JSON.parse(metadata.shipping_data);
                    const items = JSON.parse(metadata.order_items);
                    const total = parseMoney(metadata.total_amount);
                    const subtotal = parseMoney(metadata.subtotal_amount);
                    const discountAmount = parseMoney(metadata.discount_amount || 0);
                    const shippingCost = parseMoney(metadata.shipping_cost || 0);
                    const shippingMethod = metadata.shipping_method === 'delivery' ? 'delivery' : 'pickup';
                    const userId = typeof metadata.user_id === 'string' && metadata.user_id ? metadata.user_id : null;
                    const paidAmount = parseMoney(paymentData.transaction_amount);
                    const calculatedTotal = Math.round((subtotal - discountAmount + shippingCost) * 100) / 100;

                    if (
                        paymentData.currency_id !== 'ARS'
                        || Math.abs(paidAmount - total) > MONEY_TOLERANCE
                        || Math.abs(calculatedTotal - total) > MONEY_TOLERANCE
                    ) {
                        console.error(`Webhook MP: importe o moneda inválidos para el pago ${id}`);
                        return new Response(null, { status: 200 });
                    }

                    if (!Array.isArray(items) || items.length === 0 || !shippingData || typeof shippingData !== 'object' || Array.isArray(shippingData)) {
                        console.error(`Webhook MP: metadata de orden inválida para el pago ${id}`);
                        return new Response(null, { status: 200 });
                    }

                    const itemsSubtotal = Math.round(items.reduce((sum: number, item: any) => (
                        sum + parseMoney(item.price) * parsePositiveInteger(item.quantity)
                    ), 0) * 100) / 100;
                    if (Math.abs(itemsSubtotal - subtotal) > MONEY_TOLERANCE) {
                        console.error(`Webhook MP: subtotal inconsistente para el pago ${id}`);
                        return new Response(null, { status: 200 });
                    }

                    // Usar el servicio centralizado para crear la orden
                    const newOrder = await OrderService.createOrderFromCheckout({
                        items,
                        shippingData,
                        shippingMethod,
                        total,
                        subtotal,
                        discountAmount,
                        shippingCost,
                        userId,
                        paymentMethod: 'mercadopago',
                        paymentId: id,
                        notes: `Pago MP #${id} aprobado (vía Webhook).`
                    });

                    console.log(`Orden creada exitosamente desde Webhook MP`);

                    if (newOrder.success && newOrder.orderId) {
                        EmailService.sendOrderConfirmationEmails(newOrder.orderId).catch(err => console.error(err));
                    }
                }
            } catch (paymentError) {
                console.error(`Error al procesar el pago ${id}:`, paymentError);
                return new Response(null, { status: 200 });
            }
        }

        // Siempre respondemos 200 a Mercado Pago
        return new Response(null, { status: 200 });

    } catch (error) {
        console.error('Error en Webhook MP:', error);
        return new Response('Error interno', { status: 500 });
    }
};

