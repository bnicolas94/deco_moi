import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { productCostItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
    try {
        const productId = parseInt(params.id!);
        const items = await db.select().from(productCostItems).where(eq(productCostItems.productId, productId));
        return new Response(JSON.stringify(items), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request, params }) => {
    try {
        const productId = parseInt(params.id!);
        const { costItemIds } = await request.json(); // Array of IDs

        // Remove existing
        await db.delete(productCostItems).where(eq(productCostItems.productId, productId));

        // Insert new
        if (costItemIds && costItemIds.length > 0) {
            const values = costItemIds.map((id: number) => ({
                productId,
                costItemId: id
            }));
            await db.insert(productCostItems).values(values);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
