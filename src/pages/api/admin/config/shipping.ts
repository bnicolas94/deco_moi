import type { APIRoute } from 'astro';
import { updateShippingConfig } from '@/lib/services/ShippingService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const config = await request.json();

        await updateShippingConfig(config);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error al guardar configuración de envíos:', error);
        return new Response(JSON.stringify({ error: 'Error al guardar la configuración' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
