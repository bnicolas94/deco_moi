import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { categories, products } from '@/lib/db/schema';
import { eq, and, ne, count, sql } from 'drizzle-orm';

export const PUT: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    const id = parseInt(context.params.id!);
    if (isNaN(id)) return new Response('ID inválido', { status: 400 });

    try {
        const formData = await context.request.formData();
        const name = formData.get('name')?.toString();
        const slug = formData.get('slug')?.toString();
        const parentIdStr = formData.get('parentId')?.toString();
        const parentId = parentIdStr ? parseInt(parentIdStr) : null;
        const isActive = formData.get('isActive') === 'true';

        if (!name || !slug) {
            return new Response(JSON.stringify({ error: 'Nombre y slug son requeridos' }), { status: 400 });
        }

        // No self-parenting
        if (parentId === id) {
            return new Response(JSON.stringify({ error: 'Una categoría no puede ser padre de sí misma' }), { status: 400 });
        }

        // Validate slug uniqueness (excluding current)
        const existing = await db.select({ id: categories.id }).from(categories)
            .where(and(eq(categories.slug, slug), ne(categories.id, id)));
        if (existing.length > 0) {
            return new Response(JSON.stringify({ error: 'El slug ya existe' }), { status: 400 });
        }

        // Validate max 4 levels
        if (parentId) {
            const depth = await getDepth(parentId);
            if (depth >= 3) {
                return new Response(JSON.stringify({ error: 'Máximo 4 niveles de jerarquía' }), { status: 400 });
            }
        }

        // Handle image upload
        let imageUrl: string | undefined;
        const imageFile = formData.get('image') as File | null;
        if (imageFile && imageFile.size > 0 && imageFile.name) {
            const { writeFile, mkdir } = await import('node:fs/promises');
            const { join } = await import('node:path');
            const { randomUUID } = await import('node:crypto');
            const buffer = await imageFile.arrayBuffer();
            const ext = imageFile.name.split('.').pop();
            const fileName = `cat-${randomUUID()}.${ext}`;
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'categories');
            await mkdir(uploadDir, { recursive: true });
            await writeFile(join(uploadDir, fileName), new Uint8Array(buffer));
            imageUrl = `/uploads/categories/${fileName}`;
        }

        const updateData: any = {
            name,
            slug,
            parentId,
            isActive,
        };
        if (imageUrl) updateData.image = imageUrl;

        await db.update(categories).set(updateData).where(eq(categories.id, id));

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Error updating category:', e);
        return new Response(JSON.stringify({ error: 'Error al actualizar categoría' }), { status: 500 });
    }
};

// PATCH: Toggle active status
export const PATCH: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    const id = parseInt(context.params.id!);
    if (isNaN(id)) return new Response('ID inválido', { status: 400 });

    try {
        const body = await context.request.json();
        const isActive = body.isActive;

        await db.update(categories).set({ isActive }).where(eq(categories.id, id));

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Error toggling category:', e);
        return new Response(JSON.stringify({ error: 'Error al cambiar estado' }), { status: 500 });
    }
};

// DELETE: Remove category with validation
export const DELETE: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    const id = parseInt(context.params.id!);
    if (isNaN(id)) return new Response('ID inválido', { status: 400 });

    try {
        // Check for assigned products
        const productCount = await db.select({ count: count() }).from(products).where(eq(products.categoryId, id));
        if (productCount[0].count > 0) {
            return new Response(JSON.stringify({ error: `No se puede eliminar: tiene ${productCount[0].count} producto(s) asignado(s)` }), { status: 400 });
        }

        // Check for active subcategories
        const subcategories = await db.select({ id: categories.id, isActive: categories.isActive })
            .from(categories).where(eq(categories.parentId, id));
        const activeSubcats = subcategories.filter(s => s.isActive);
        if (activeSubcats.length > 0) {
            return new Response(JSON.stringify({ error: `No se puede eliminar: tiene ${activeSubcats.length} subcategoría(s) activa(s)` }), { status: 400 });
        }

        await db.delete(categories).where(eq(categories.id, id));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Error deleting category:', e);
        return new Response(JSON.stringify({ error: 'Error al eliminar categoría' }), { status: 500 });
    }
};

async function getDepth(categoryId: number): Promise<number> {
    let depth = 0;
    let currentId: number | null = categoryId;
    while (currentId) {
        depth++;
        const parent = await db.select({ parentId: categories.parentId }).from(categories).where(eq(categories.id, currentId));
        currentId = parent[0]?.parentId || null;
    }
    return depth;
}
