import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { products, productVariants, productionTimeRules, meliItemLinks, productCostItems, productSupplies, priceRules, mockupTemplates } from '@/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const { ids, action } = await context.request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return new Response(JSON.stringify({ error: 'No se proporcionaron IDs' }), { status: 400 });
        }

        if (action === 'delete') {
            await db.transaction(async (tx) => {
                // Bulk delete is tricky with constraints if not cascade, but schema shows some cascades.
                // To be safe, we delete related records first if necessary according to schema.

                await tx.delete(meliItemLinks).where(inArray(meliItemLinks.productId, ids));
                await tx.delete(productionTimeRules).where(inArray(productionTimeRules.productId, ids));
                await tx.delete(priceRules).where(inArray(priceRules.productId, ids));
                await tx.delete(mockupTemplates).where(inArray(mockupTemplates.productId, ids));
                await tx.delete(productVariants).where(inArray(productVariants.productId, ids));
                await tx.delete(productCostItems).where(inArray(productCostItems.productId, ids));
                await tx.delete(productSupplies).where(inArray(productSupplies.productId, ids));

                await tx.delete(products).where(inArray(products.id, ids));
            });
            return new Response(JSON.stringify({ success: true, message: 'Productos eliminados correctamente' }), { status: 200 });
        }

        if (action === 'deactivate') {
            await db.update(products).set({ isActive: false }).where(inArray(products.id, ids));
            return new Response(JSON.stringify({ success: true, message: 'Productos desactivados correctamente' }), { status: 200 });
        }

        if (action === 'activate') {
            await db.update(products).set({ isActive: true }).where(inArray(products.id, ids));
            return new Response(JSON.stringify({ success: true, message: 'Productos activados correctamente' }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: 'Acción no válida' }), { status: 400 });
    } catch (e) {
        console.error('Bulk Action Error:', e);
        return new Response(JSON.stringify({ error: 'Error al procesar acción masiva' }), { status: 500 });
    }
};
