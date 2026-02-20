import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { shippingRealCosts } from '@/lib/db/schema';
import { z } from 'zod';

const shippingSchema = z.object({
    zone: z.string().min(1),
    realCost: z.number().min(0)
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const parsed = shippingSchema.parse({
            ...data,
            realCost: parseFloat(data.realCost)
        });

        const newShippingCosts = await db.insert(shippingRealCosts).values({
            zone: parsed.zone,
            realCost: parsed.realCost.toString()
        }).onConflictDoUpdate({
            target: shippingRealCosts.zone,
            set: {
                realCost: parsed.realCost.toString(),
                updatedAt: new Date()
            }
        }).returning();

        return new Response(JSON.stringify(newShippingCosts[0]), { status: 201 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Invalid data' }), { status: 400 });
    }
}
