import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { categories, products } from '@/lib/db/schema';
import { eq, count, asc, sql } from 'drizzle-orm';
import { assertMultipartRequest, ImageUploadError, saveUploadedImage } from '@/lib/security/uploads';

export const GET: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        // Get all categories with product count
        const allCategories = await db
            .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                image: categories.image,
                parentId: categories.parentId,
                order: categories.order,
                isActive: categories.isActive,
                createdAt: categories.createdAt,
                productCount: sql<number>`(SELECT COUNT(*) FROM products WHERE products.category_id = ${categories.id})::int`,
            })
            .from(categories)
            .orderBy(asc(categories.order), asc(categories.name));

        return new Response(JSON.stringify(allCategories), { status: 200 });
    } catch (e) {
        console.error('Error fetching categories:', e);
        return new Response(JSON.stringify({ error: 'Error al obtener categorías' }), { status: 500 });
    }
};

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        assertMultipartRequest(context.request);
        const formData = await context.request.formData();
        const name = formData.get('name')?.toString();
        const slug = formData.get('slug')?.toString();
        const parentIdStr = formData.get('parentId')?.toString();
        const parentId = parentIdStr ? parseInt(parentIdStr) : null;
        const isActive = formData.get('isActive') === 'true';

        if (!name || !slug) {
            return new Response(JSON.stringify({ error: 'Nombre y slug son requeridos' }), { status: 400 });
        }

        // Validate slug uniqueness
        const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
        if (existing.length > 0) {
            return new Response(JSON.stringify({ error: 'El slug ya existe' }), { status: 400 });
        }

        // Validate max 4 levels of hierarchy
        if (parentId) {
            const depth = await getDepth(parentId);
            if (depth >= 3) {
                return new Response(JSON.stringify({ error: 'Máximo 4 niveles de jerarquía' }), { status: 400 });
            }
        }

        // Handle image upload
        let imageUrl: string | null = null;
        const imageFile = formData.get('image') as File | null;
        if (imageFile && imageFile.size > 0 && imageFile.name) {
            imageUrl = await saveUploadedImage(imageFile, 'categories', 'cat-');
        }

        // Get max order for placement
        const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(${categories.order}), 0)` }).from(categories);
        const newOrder = (maxOrder[0]?.max || 0) + 1;

        const [newCategory] = await db.insert(categories).values({
            name,
            slug,
            image: imageUrl,
            parentId,
            order: newOrder,
            isActive,
        }).returning();

        return new Response(JSON.stringify({ success: true, id: newCategory.id }), { status: 201 });
    } catch (e) {
        if (e instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: e.message }), { status: e.status });
        }
        console.error('Error creating category:', e);
        return new Response(JSON.stringify({ error: 'Error al crear categoría' }), { status: 500 });
    }
};

async function getDepth(categoryId: number): Promise<number> {
    let depth = 0;
    let currentId: number | null = categoryId;
    const visited = new Set<number>();
    while (currentId) {
        if (visited.has(currentId) || depth >= 4) return Number.POSITIVE_INFINITY;
        visited.add(currentId);
        depth++;
        const parent = await db.select({ parentId: categories.parentId }).from(categories).where(eq(categories.id, currentId));
        currentId = parent[0]?.parentId || null;
    }
    return depth;
}
