import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
    const slug = context.params.slug;
    if (!slug) return new Response('Slug requerido', { status: 400 });

    try {
        const isPreview = context.url.searchParams.get('preview') === 'true';
        
        if (isPreview && (!context.locals.user || context.locals.user.role !== 'admin')) {
             return new Response('No autorizado para preview', { status: 401 });
        }

        const result = await db.select({
            id: pages.id,
            title: pages.title,
            slug: pages.slug,
            status: pages.status,
            blocks: pages.blocks,
            seoTitle: pages.seoTitle,
            seoDescription: pages.seoDescription,
            ogImage: pages.ogImage,
            publishedAt: pages.publishedAt,
            createdAt: pages.createdAt,
            updatedAt: pages.updatedAt
        }).from(pages).where(eq(pages.slug, slug));
        
        if (!result.length) {
            return new Response(JSON.stringify({ error: 'Página no encontrada' }), { status: 404 });
        }
        
        const page = result[0];
        
        if (!isPreview && page.status !== 'published') {
            return new Response(JSON.stringify({ error: 'Página no encontrada' }), { status: 404 });
        }

        return new Response(JSON.stringify(page), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error('Error fetching page by slug:', e);
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};
