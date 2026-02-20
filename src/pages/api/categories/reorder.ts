import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { categories } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const PUT: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const body = await context.request.json();
        const items: Array<{ id: number; order: number }> = body.items || [];

        if (items.length === 0) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        // Update each category's order
        for (const item of items) {
            await db.update(categories)
                .set({ order: item.order })
                .where(eq(categories.id, item.id));
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Error reordering categories:', e);
        return new Response(JSON.stringify({ error: 'Error al reordenar categorías' }), { status: 500 });
    }
};
