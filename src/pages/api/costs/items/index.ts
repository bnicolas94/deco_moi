import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { costItems } from '@/lib/db/schema';
import { z } from 'zod';

const itemSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().min(0),
    isGlobal: z.boolean().default(false),
    isActive: z.boolean().default(true)
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const parsed = itemSchema.parse({
            ...data,
            value: parseFloat(data.value)
        });

        const newItems = await db.insert(costItems).values({
            name: parsed.name,
            type: parsed.type,
            value: parsed.value.toString(),
            isGlobal: parsed.isGlobal,
            isActive: parsed.isActive
        }).returning();

        return new Response(JSON.stringify(newItems[0]), { status: 201 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Invalid data' }), { status: 400 });
    }
}
