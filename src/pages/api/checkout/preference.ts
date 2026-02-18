import type { APIRoute } from 'astro';
import { preference } from '@/lib/mercadopago';

export const POST: APIRoute = async (context) => {
    try {
        const body = await context.request.json();
        const { items, shippingData, total, subtotal } = body;

        console.log('API: Iniciando creación de preferencia MP con', items.length, 'ítems');

        const accessToken = import.meta.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
        console.log('API: Token presente:', !!accessToken, accessToken ? `(Inicia con ${accessToken.substring(0, 10)}...)` : '');

        // Validaciones básicas
        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });
        }

        // URL base del sitio desde .env (limpiando posibles comillas)
        let baseUrl = (import.meta.env.PUBLIC_URL || process.env.PUBLIC_URL || 'http://localhost:4321').replace(/"/g, '');

        // Asegurar protocolo
        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }

        // Construir los items para Mercado Pago
        const mpItems = items.map((item: any) => {
            // Asegurar que la imagen sea una URL absoluta si existe
            let picture_url = item.image;
            if (picture_url && !picture_url.startsWith('http')) {
                picture_url = `${baseUrl}${picture_url.startsWith('/') ? '' : '/'}${picture_url}`;
            }

            return {
                id: String(item.id),
                title: item.name,
                unit_price: Number(item.price),
                quantity: Number(item.quantity),
                currency_id: 'ARS',
                description: item.variantName || '',
                picture_url: picture_url || undefined
            };
        });

        // Crear la preferencia
        const preferenceData = {
            body: {
                items: mpItems,
                back_urls: {
                    success: `${baseUrl}/checkout/success`,
                    failure: `${baseUrl}/checkout/failure`,
                    pending: `${baseUrl}/checkout/pending`,
                },
                auto_return: 'approved',
                notification_url: `${baseUrl}/api/checkout/webhook`,
                statement_descriptor: 'DECOMOI',
                metadata: {
                    shipping_data: JSON.stringify(shippingData),
                    order_items: JSON.stringify(items.map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        variantId: i.variantId,
                        sku: i.sku
                    }))),
                    total_amount: total,
                    subtotal_amount: subtotal,
                    user_id: context.locals.user?.id || null
                }
            }
        };

        console.log('API: Enviando Preference a MP:', JSON.stringify(preferenceData, null, 2));

        const result = await preference.create(preferenceData);
        console.log('API: Preferencia MP creada con ID:', result.id);

        return new Response(JSON.stringify({
            id: result.id,
            init_point: result.init_point
        }), { status: 200 });

    } catch (error: any) {
        console.error('API Error creando preferencia MP:', error);

        // El error en el SDK v2 suele venir en error.apiResponse
        let errorDetail = error.message;
        if (error.apiResponse) {
            try {
                const apiError = await error.apiResponse.json();
                errorDetail = JSON.stringify(apiError);
            } catch (e) { }
        }

        return new Response(JSON.stringify({
            error: 'Error al iniciar el pago con Mercado Pago',
            details: errorDetail
        }), { status: 500 });
    }
};
