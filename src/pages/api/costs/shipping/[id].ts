import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { shippingRealCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const id = parseInt(params.id!);
        await db.delete(shippingRealCosts).where(eq(shippingRealCosts.id, id));
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
