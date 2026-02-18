import type { APIRoute } from 'astro';
import { updateCheckoutFields } from '@/lib/services/ConfigService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { fields } = await request.json();

        if (!fields || !Array.isArray(fields)) {
            return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
        }

        await updateCheckoutFields(fields);

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Error al guardar campos de checkout:', e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
}
