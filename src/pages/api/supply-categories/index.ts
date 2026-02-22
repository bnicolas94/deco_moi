import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { supplyCategories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    icon: z.string().optional(),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const GET: APIRoute = async () => {
    try {
        const data = await db.select().from(supplyCategories).orderBy(asc(supplyCategories.order));
        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const parsed = categorySchema.parse(body);

        const [newCategory] = await db.insert(supplyCategories).values(parsed).returning();
        return new Response(JSON.stringify(newCategory), { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: error.errors }), { status: 400 });
        }
        console.error('Error creating category:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
