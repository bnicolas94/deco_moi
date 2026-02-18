import type { APIRoute } from 'astro';
import { mpClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import { OrderService } from '@/lib/services/OrderService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || url.searchParams.get('topic');
        const id = url.searchParams.get('data.id') || url.searchParams.get('id');

        console.log(`Webhook MP recibido: tipo=${type}, id=${id}`);

        // Solo procesamos pagos
        if (type === 'payment' && id) {


            try {
                const payment = new Payment(mpClient);
                const paymentData = await payment.get({ id });

                console.log(`Estado del pago MP ${id}: ${paymentData.status}`);

                // Si el pago está aprobado, creamos la orden
                if (paymentData.status === 'approved') {
                    const metadata = paymentData.metadata;

                    if (!metadata) {
                        console.error('No hay metadata en el pago de MP');
                        return new Response(null, { status: 200 });
                    }

                    const shippingData = JSON.parse(metadata.shipping_data);
                    const items = JSON.parse(metadata.order_items);
                    const total = metadata.total_amount;
                    const subtotal = metadata.subtotal_amount;
                    const userId = metadata.user_id;

                    // Usar el servicio centralizado para crear la orden
                    await OrderService.createOrderFromCheckout({
                        items,
                        shippingData,
                        total: Number(total),
                        subtotal: Number(subtotal),
                        userId,
                        paymentMethod: 'mercadopago',
                        paymentId: id,
                        notes: `Pago MP #${id} aprobado (vía Webhook).`
                    });

                    console.log(`Orden creada exitosamente desde Webhook MP`);
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

