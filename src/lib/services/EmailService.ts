import { db } from '@/lib/db/connection';
import { orders, orderItems, emailQueue, users, siteConfig, addresses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ClientOrderConfirmationTemplate } from '@/emails/ClientOrderConfirmation';
import { AdminOrderConfirmationTemplate } from '@/emails/AdminOrderConfirmation';

export class EmailService {
    private static async getAdminEmail() {
        const adminEmailEnv = process.env.ADMIN_EMAIL || import.meta.env.ADMIN_EMAIL;
        if (adminEmailEnv) {
            return adminEmailEnv;
        }

        const config = await db.select().from(siteConfig).where(eq(siteConfig.key, 'admin_email'));
        if (config && config.length > 0) {
            return config[0].value.email; // assuming value is JSON { email: '...' }
        }
        return 'info@decomoi.com.ar'; // default fallback
    }

    private static async sendWithRetry(
        orderId: string,
        recipientRole: 'client' | 'admin',
        to: string,
        subject: string,
        htmlBody: string,
        replyTo?: string
    ) {
        const apiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
        const maxRetries = 3;
        let attempt = 0;
        let lastError = null;

        while (attempt < maxRetries) {
            try {
                attempt++;

                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Deco Moi <info@decomoi.com.ar>',
                        to: [to],
                        subject: subject,
                        html: htmlBody,
                        reply_to: replyTo
                    })
                });

                if (response.ok) {
                    console.log(`Email sent successfully to ${to} (Role: ${recipientRole}) on attempt ${attempt}`);
                    return true;
                } else {
                    const errorData = await response.text();
                    throw new Error(`Resend API Error: ${response.status} - ${errorData}`);
                }
            } catch (error: any) {
                lastError = error;
                console.error(`Attempt ${attempt} to send email failed for ${to}:`, error.message);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`Failed to send email to ${to} after ${maxRetries} attempts. Queueing into database.`);

        // Log to database on final failure
        await db.insert(emailQueue).values({
            orderId,
            recipientRole,
            recipientEmail: to,
            subject,
            htmlBody,
            errorLog: lastError?.message || 'Unknown error',
            attempts: maxRetries,
            status: 'failed'
        });

        return false;
    }

    public static async sendOrderConfirmationEmails(orderId: string) {
        try {
            // 1. Fetch Order Details
            const orderData = await db.select().from(orders).where(eq(orders.id, orderId));
            if (!orderData || orderData.length === 0) {
                console.error(`EmailService: Order ${orderId} not found.`);
                return;
            }
            const order = orderData[0];

            // 2. Fetch Items
            const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

            // 3. Fetch Customer
            let customer = { name: '', email: '', phone: '' };

            // Prioritize checkout form data (shippingData)
            if (order.shippingData) {
                customer.email = order.shippingData.email || '';
                customer.name = order.shippingData.full_name || order.shippingData.name || '';
                customer.phone = order.shippingData.phone || '';
            }

            // Fallback to user account data if any field is missing
            if ((!customer.email || !customer.name || !customer.phone) && order.userId) {
                const userData = await db.select().from(users).where(eq(users.id, order.userId));
                if (userData && userData.length > 0) {
                    customer.name = customer.name || userData[0].name || '';
                    customer.email = customer.email || userData[0].email || '';
                    customer.phone = customer.phone || userData[0].phone || '';
                }
            }

            const adminEmail = await this.getAdminEmail();

            // Dynamic import ConfigService to avoid circular dependencies if any
            const { getBankTransferConfig } = await import('@/lib/services/ConfigService');
            const bankConfig = await getBankTransferConfig();

            const templateData = { order, items, customer, bankConfig };

            // 4. Generate HTML payloads
            const clientSubject = order.paymentMethod === 'transfer'
                ? `¡Tu pedido ya casi está! Orden #${order.orderNumber}`
                : `¡Tu pedido está confirmado! Orden #${order.orderNumber}`;

            const clientHtml = ClientOrderConfirmationTemplate(templateData);

            const adminSubject = `🛍️ Nueva venta registrada — Orden #${order.orderNumber} — $${Number(order.total).toLocaleString('es-AR')} ARS`;
            const adminHtml = AdminOrderConfirmationTemplate(templateData);

            // 5. Send in parallel
            const dispatchPromises: Promise<any>[] = [];

            // Client Email
            if (customer.email) {
                dispatchPromises.push(
                    this.sendWithRetry(
                        orderId,
                        'client',
                        customer.email,
                        clientSubject,
                        clientHtml,
                        adminEmail // ReplyTo admin for client
                    )
                );
            } else {
                console.warn(`EmailService: No customer email found for order ${orderId}`);
            }

            // Admin Email
            dispatchPromises.push(
                this.sendWithRetry(
                    orderId,
                    'admin',
                    adminEmail,
                    adminSubject,
                    adminHtml
                )
            );

            await Promise.allSettled(dispatchPromises);

        } catch (error) {
            console.error(`EmailService: Fatal error processing emails for order ${orderId}`, error);
        }
    }

    public static async sendUnmatchedTransferAlert(amount: number, senderDni: string, mpPaymentId: string) {
        try {
            const adminEmail = await this.getAdminEmail();
            const subject = `⚠️ Transferencia No Asociada — $${amount.toLocaleString('es-AR')} ARS`;
            const htmlBody = `
                <h2>Atención: Transferencia no asociada a ninguna orden</h2>
                <p>El sistema ha detectado un ingreso por transferencia bancaria en Mercado Pago que no pudo ser matcheado automáticamente con ninguna orden pendiente.</p>
                <ul>
                    <li><strong>Monto:</strong> $${amount.toLocaleString('es-AR')} ARS</li>
                    <li><strong>DNI del Emisor:</strong> ${senderDni}</li>
                    <li><strong>ID de Pago (MP):</strong> ${mpPaymentId}</li>
                </ul>
                <p>Por favor, revisá los movimientos en Mercado Pago y las órdenes en el panel de administración manual.</p>
            `;

            await this.sendWithRetry(
                'unmatched-' + mpPaymentId,
                'admin',
                adminEmail,
                subject,
                htmlBody
            );
        } catch (e) {
            console.error('EmailService: Error enviando alerta de transferencia no matcheada', e);
        }
    }

    public static async sendPaymentConfirmedEmail(orderId: string) {
        try {
            const orderData = await db.select().from(orders).where(eq(orders.id, orderId));
            if (!orderData || orderData.length === 0) return;
            const order = orderData[0];

            const customerEmail = order.shippingData?.email;
            if (!customerEmail) return;

            const subject = `✅ ¡Pago confirmado! — Orden #${order.orderNumber}`;
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #000; margin: 0;">Deco Moi</h1>
                    </div>
                    <h2 style="color: #2e7d32; text-align: center;">¡Tu pago ha sido confirmado!</h2>
                    <p>Hola <strong>${order.shippingData?.full_name || 'Cliente'}</strong>,</p>
                    <p>Te informamos que hemos recibido y validado correctamente tu transferencia bancaria para la orden <strong>#${order.orderNumber}</strong>.</p>
                    <p>Tu pedido ya se encuentra en estado <strong>Aprobado</strong> y estamos trabajando en su preparación.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Resumen del pago:</strong></p>
                        <p style="margin: 5px 0 0 0;">Monto: $${Number(order.total).toLocaleString('es-AR')} ARS</p>
                        <p style="margin: 5px 0 0 0;">Método: Transferencia Bancaria</p>
                    </div>

                    <p>Te avisaremos por esta misma vía cuando tu pedido sea despachado.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        Este es un mensaje automático, por favor no lo respondas.<br>
                        Deco Moi — Objetos con amor para tu hogar.
                    </p>
                </div>
            `;

            await this.sendWithRetry(orderId, 'client', customerEmail, subject, html);
            console.log(`Email de confirmación de pago enviado para orden ${order.orderNumber}`);
        } catch (e) {
            console.error('EmailService: Error enviando email de pago confirmado', e);
        }
    }
}
