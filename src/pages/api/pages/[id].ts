import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }
    const id = context.params.id;
    if (!id) return new Response('ID requerido', { status: 400 });

    try {
        const page = await db.select({
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
        }).from(pages).where(eq(pages.id, id));
        if (!page.length) {
            return new Response(JSON.stringify({ error: 'Página no encontrada' }), { status: 404 });
        }
        return new Response(JSON.stringify(page[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};

export const PUT: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }
    const id = context.params.id;
    if (!id) return new Response('ID requerido', { status: 400 });

    try {
        const body = await context.request.json();
        
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (body.title !== undefined) updateData.title = body.title;
        if (body.slug !== undefined) updateData.slug = body.slug;
        if (body.blocks !== undefined) updateData.blocks = body.blocks;
        if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
        if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
        if (body.ogImage !== undefined) updateData.ogImage = body.ogImage;

        const [updatedPage] = await db.update(pages).set(updateData).where(eq(pages.id, id)).returning({
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
        });
        
        return new Response(JSON.stringify({ success: true, page: updatedPage }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error('Error updating page:', e);
        return new Response(JSON.stringify({ error: 'Error al actualizar página' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }
    const id = context.params.id;
    if (!id) return new Response('ID requerido', { status: 400 });

    try {
        await db.update(pages).set({ status: 'archived', updatedAt: new Date() }).where(eq(pages.id, id));
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};
