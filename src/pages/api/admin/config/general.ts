import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { siteConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { whatsapp, instagram } = body;

        const setConfigField = async (key: string, value: any, description: string) => {
            const existing = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
            if (existing.length === 0) {
                await db.insert(siteConfig).values({
                    key,
                    value,
                    description,
                    updatedAt: new Date()
                });
            } else {
                await db.update(siteConfig)
                    .set({ value, updatedAt: new Date() })
                    .where(eq(siteConfig.key, key));
            }
        };

        if (whatsapp !== undefined) await setConfigField('contact_whatsapp', whatsapp, 'Número de WhatsApp de contacto (solo números)');
        if (instagram !== undefined) await setConfigField('social_instagram', instagram, 'Link al perfil de Instagram');

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error('Error saving general config:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
