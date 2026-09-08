import type { APIRoute } from 'astro';
import { contactFaqConfigSchema } from '@/lib/config/contactFaq';
import { updateContactFaqConfig } from '@/lib/services/ConfigService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const parsed = contactFaqConfigSchema.safeParse(body);

        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message || 'Datos inválidos';
            return new Response(JSON.stringify({ error: message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await updateContactFaqConfig(parsed.data);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error saving contact FAQ configuration:', error);
        return new Response(JSON.stringify({ error: 'No se pudieron guardar las preguntas frecuentes' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
