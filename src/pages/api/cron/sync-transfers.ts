import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { orders, payments, unmatchedTransfers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PaymentStatus } from '@/types/order';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { EmailService } from '@/lib/services/EmailService';

const accessToken = import.meta.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';
const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

export const GET: APIRoute = async ({ request }) => {
    try {
        // En producción podrías agregar autenticación acá, evaluando request.headers.get('Authorization')

        if (!accessToken) {
            return new Response('MP_ACCESS_TOKEN no configurado', { status: 500 });
        }

        const payment = new Payment(client);

        // Buscar los cobros de la última hora (o últimas X operaciones)
        const result = await payment.search({
            options: {
                criteria: 'desc',
                sort: 'date_created',
                limit: 50,
                offset: 0
            }
        });

        if (!result.results || result.results.length === 0) {
            return new Response(JSON.stringify({ status: 'ok', message: 'No se encontraron pagos recientes' }), { status: 200 });
        }

        const stats = { processed: 0, matched: 0, unmatched: 0, already_processed: 0 };

        for (const p of result.results) {
            // Solo nos interesan transferencias bancarias o account_fund que puedan ser transferencias entrantes pasivas
            // A veces MercadoPago los clasifica como 'bank_transfer' (tipo) y 'debin_transfer' o 'account_money'.
            if (p.status !== 'approved') continue;

            // Evaluamos si es transferencia pasiva o a CVU
            // Nota: las transferencias a CVU suelen tener payment_type_id: 'bank_transfer' o tener operation_type: 'account_fund'
            const isTransfer = p.payment_type_id === 'bank_transfer' || p.operation_type === 'account_fund';
            if (!isTransfer) continue;

            const mpPaymentId = String(p.id);
            const amount = Number(p.transaction_amount);
            let senderDni = p.payer?.identification?.number || null;

            if (!senderDni) continue; // Si no hay DNI, no podemos matchear

            // Mercado Pago a veces devuelve el CUIL en lugar del DNI de la cuenta. 
            // Si tiene 11 dígitos, asumimos que es CUIL y limpiamos los primeros 2 y el último 1.
            if (senderDni.length === 11) {
                senderDni = senderDni.substring(2, 10);
            }

            // 1. Verificar idempotencia
            const existingPayment = await db.query.payments.findFirst({
                where: eq(payments.transactionId, mpPaymentId)
            });

            if (existingPayment) {
                stats.already_processed++;
                continue;
            }

            const existingUnmatched = await db.query.unmatchedTransfers.findFirst({
                where: eq(unmatchedTransfers.mpPaymentId, mpPaymentId)
            });

            if (existingUnmatched) {
                stats.already_processed++;
                continue;
            }

            stats.processed++;

            // 2. Buscar orden para matchear
            // Criterios: status pendiente de transferencia, dni coincide. (Monto ± 1 peso por redondeos)
            const minAmount = amount - 1;
            const maxAmount = amount + 1;

            const pendingOrders = await db.select().from(orders).where(eq(orders.paymentStatus, PaymentStatus.PENDING_TRANSFER));

            let matchedOrder = null;

            for (const order of pendingOrders) {
                const orderTotal = Number(order.total);
                const checkoutDni = order.shippingData?.transfer_dni;

                // 1. Intento de Match Exacto (Monto ± 1 + DNI coincidente)
                if (orderTotal >= minAmount && orderTotal <= maxAmount) {
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
                    console.log(`[i] Match por monto único (Fallback) para orden ${matchedOrder.orderNumber}`);
                }
            }

            if (matchedOrder) {
                // Matcheo Exitoso! Confirmar orden
                await db.update(orders)
                    .set({ paymentStatus: PaymentStatus.APPROVED, updatedAt: new Date() })
                    .where(eq(orders.id, matchedOrder.id));

                await db.insert(payments).values({
                    orderId: matchedOrder.id,
                    method: 'mercadopago_transfer',
                    status: PaymentStatus.APPROVED,
                    amount: String(amount),
                    transactionId: mpPaymentId,
                    metadata: { notes: `Auto-detectado de MP: DNI ${senderDni}` }
                });

                // Enviar email de confirmación de pago
                EmailService.sendPaymentConfirmedEmail(matchedOrder.id).catch(err => console.error(err));

                stats.matched++;
            } else {
                // No hay match (Unmatched Transfer)
                await db.insert(unmatchedTransfers).values({
                    amount: String(amount),
                    senderDni: senderDni,
                    mpPaymentId: mpPaymentId,
                    paymentDate: new Date(p.date_created || Date.now()),
                    rawMetadata: p,
                    status: 'pending_review'
                });

                // Enviar alerta al admin
                EmailService.sendUnmatchedTransferAlert(amount, senderDni, mpPaymentId).catch(err => console.error(err));
                console.warn(`[!] Transferencia no asignada: DNI ${senderDni} - $${amount}`);

                stats.unmatched++;
            }
        }

        return new Response(JSON.stringify({ status: 'ok', stats }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('Cron sync error:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
