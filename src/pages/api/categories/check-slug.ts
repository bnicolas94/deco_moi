import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { categories } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
    const slug = context.url.searchParams.get('slug');
    const excludeId = context.url.searchParams.get('excludeId');

    if (!slug) {
        return new Response(JSON.stringify({ available: true }), { status: 200 });
    }

    try {
        let query = db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));

        const results = await query;
        const filtered = excludeId
            ? results.filter(r => r.id !== parseInt(excludeId))
            : results;

        return new Response(JSON.stringify({ available: filtered.length === 0 }), { status: 200 });
    } catch (e) {
        console.error('Error checking slug:', e);
        return new Response(JSON.stringify({ available: false }), { status: 500 });
    }
};
