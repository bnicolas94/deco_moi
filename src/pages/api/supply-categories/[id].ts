import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { supplyCategories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    icon: z.string().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const id = parseInt(params.id!);
        if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 });

        const body = await request.json();
        const parsed = categorySchema.parse(body);

        const [updated] = await db.update(supplyCategories)
            .set({ ...parsed, updatedAt: new Date() })
            .where(eq(supplyCategories.id, id))
            .returning();

        if (!updated) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: error.errors }), { status: 400 });
        }
        console.error('Error updating category:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const id = parseInt(params.id!);
        if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 });

        const [deleted] = await db.delete(supplyCategories)
            .where(eq(supplyCategories.id, id))
            .returning();

        if (!deleted) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

        return new Response(JSON.stringify({ message: 'Deleted successfully' }), { status: 200 });
    } catch (error) {
        console.error('Error deleting category:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
