import type { APIRoute } from 'astro';
import {
    CheckoutValidationError,
    parseCheckoutRequest,
    validateCheckoutPayload,
} from '@/lib/services/CheckoutValidationService';
import { EmailService } from '@/lib/services/EmailService';
import { OrderService } from '@/lib/services/OrderService';

function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export const POST: APIRoute = async (context) => {
    try {
        const checkout = await validateCheckoutPayload(await parseCheckoutRequest(context.request));

        // Las órdenes de Mercado Pago solo se crean después de validar su webhook.
        if (checkout.paymentMethod !== 'transfer') {
            throw new CheckoutValidationError('Método de pago inválido');
        }

        const newOrder = await OrderService.createOrderFromCheckout({
            items: checkout.items,
            shippingData: {
                ...checkout.shippingData,
                selectedShipping: checkout.selectedShipping,
            },
            shippingMethod: checkout.shippingMethod,
            total: checkout.total,
            subtotal: checkout.subtotal,
            discountAmount: checkout.discountAmount,
            shippingCost: checkout.shippingCost,
            userId: context.locals.user?.id || null,
            paymentMethod: 'transfer',
            notes: checkout.notes,
        });

        EmailService.sendOrderConfirmationEmails(newOrder.orderId, { skipAdmin: true })
            .catch((error) => console.error('Error enviando confirmación de orden:', error));

        return jsonResponse({
            ...newOrder,
            total: checkout.total,
        }, 201);
    } catch (error) {
        if (error instanceof CheckoutValidationError) {
            return jsonResponse({ error: error.message }, error.status);
        }

        console.error('Error al crear orden:', error);
        return jsonResponse({ error: 'Error al procesar el pedido' }, 500);
    }
};
