import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { siteConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { holder, cvu, discount } = body;

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

        if (holder !== undefined) await setConfigField('bank_transfer_holder', holder, 'Titular de la cuenta para transferencias');
        if (cvu !== undefined) await setConfigField('bank_transfer_cvu', cvu, 'CVU/CBU/Alias para transferencias');
        if (discount !== undefined) await setConfigField('bank_transfer_discount', Number(discount), 'Descuento (%) por transferencia bancaria');

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
