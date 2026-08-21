import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PageContentError, sanitizePageBlocks } from '@/lib/security/pageBlocks';

export const PUT: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }
    const id = context.params.id;
    if (!id) return new Response('ID requerido', { status: 400 });

    try {
        const page = await db.select({ status: pages.status, blocks: pages.blocks }).from(pages).where(eq(pages.id, id));
        if (!page.length) {
            return new Response(JSON.stringify({ error: 'Página no encontrada' }), { status: 404 });
        }

        const newStatus = page[0].status === 'published' ? 'draft' : 'published';
        const publishedAt = newStatus === 'published' ? new Date() : null;

        const safeBlocks = sanitizePageBlocks(page[0].blocks || []);
        const [updatedPage] = await db.update(pages)
            .set({ status: newStatus, publishedAt, blocks: safeBlocks, updatedAt: new Date() })
            .where(eq(pages.id, id))
            .returning({
                id: pages.id,
                status: pages.status
            });
            
        return new Response(JSON.stringify({ success: true, status: updatedPage.status }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        if (e instanceof PageContentError) {
            return new Response(JSON.stringify({ error: e.message }), { status: 400 });
        }
        console.error('Error publishing page:', e);
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};
