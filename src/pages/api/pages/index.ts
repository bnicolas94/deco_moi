import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { pages, pageTemplates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const url = new URL(context.request.url);
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const status = url.searchParams.get('status') || '';

        let allPages = await db.select({
            id: pages.id,
            title: pages.title,
            slug: pages.slug,
            status: pages.status,
            updatedAt: pages.updatedAt,
            publishedAt: pages.publishedAt,
        }).from(pages).orderBy(desc(pages.updatedAt));

        if (status) {
            allPages = allPages.filter(p => p.status === status);
        }
        if (search) {
            allPages = allPages.filter(p => p.title.toLowerCase().includes(search) || p.slug.toLowerCase().includes(search));
        }

        return new Response(JSON.stringify(allPages), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error('Error fetching pages:', e);
        return new Response(JSON.stringify({ error: 'Error al obtener páginas' }), { status: 500 });
    }
};

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const body = await context.request.json();
        const { title, slug, status, blocks, seoTitle, seoDescription, ogImage, templateId } = body;

        if (!title || !slug) {
            return new Response(JSON.stringify({ error: 'Título y slug son requeridos' }), { status: 400 });
        }

        const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug));
        if (existing.length > 0) {
            return new Response(JSON.stringify({ error: 'El slug ya existe' }), { status: 400 });
        }

        let initialBlocks = blocks || [];
        
        if (templateId) {
            const tmpl = await db.select({
                id: pageTemplates.id,
                blocks: pageTemplates.blocks
            }).from(pageTemplates).where(eq(pageTemplates.id, parseInt(templateId)));
            if (tmpl.length > 0 && tmpl[0].blocks) {
                // Generar nuevos IDs para los bloques del template
                initialBlocks = (tmpl[0].blocks as any[]).map(b => ({
                    ...b,
                    id: Math.random().toString(36).substring(2, 15) // simple id generation for new blocks
                }));
            }
        }

        const [newPage] = await db.insert(pages).values({
            title,
            slug,
            status: status || 'draft',
            blocks: initialBlocks,
            seoTitle,
            seoDescription,
            ogImage,
        }).returning({
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

        return new Response(JSON.stringify({ success: true, page: newPage }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error('Error creating page:', e);
        return new Response(JSON.stringify({ error: 'Error al crear página' }), { status: 500 });
    }
};
