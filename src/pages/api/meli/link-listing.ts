import type { APIContext } from 'astro';
import { db } from '../../../lib/db/connection';
import { meliItemLinks, meliOrders } from '../../../lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getMeliItem } from '../../../lib/integrations/mercadolibre/items';
import { MeliService } from '../../../lib/services/MeliService';

export async function POST({ request }: APIContext) {
    try {
        const body = await request.json();
        const { meliItemId, meliVariationId, productId, syncEnabled, packQuantity } = body;

        if (!meliItemId || !productId) {
            return new Response(JSON.stringify({ success: false, error: 'Faltan parámetros: meliItemId o productId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const parsedProductId = Number(productId);
        const quantity = Math.max(1, Math.trunc(Number(packQuantity) || 1));
        if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
            return new Response(JSON.stringify({ success: false, error: 'El producto seleccionado no es válido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Obtener info del item en ML para guardar el título también
        let meliTitle = '';
        let meliCategoryId: string | null = null;
        let meliListingType: string | null = null;
        try {
            const mlItem = await getMeliItem(meliItemId);
            meliTitle = mlItem.title;
            meliCategoryId = mlItem.category_id || null;
            meliListingType = mlItem.listing_type_id || null;
        } catch (e) {
            console.error('Error obteniendo item ML para título:', e);
            // Seguimos adelante, el título es secundario para funcionar
        }

        // Buscar si ya existe este vínculo específico (meliItemId, meliVariationId)
        const existing = await db.select()
            .from(meliItemLinks)
            .where(
                and(
                    eq(meliItemLinks.meliItemId, meliItemId),
                    meliVariationId ? eq(meliItemLinks.meliVariationId, meliVariationId) : isNull(meliItemLinks.meliVariationId)
                )
            )
            .limit(1);

        const applySync = syncEnabled !== undefined ? syncEnabled : true;

        if (existing.length > 0) {
            // Ya existe un vínculo para esta publicación/variación, lo actualizamos con el nuevo productId
            await db.update(meliItemLinks).set({
                productId: parsedProductId,
                meliTitle: meliTitle || existing[0].meliTitle,
                meliCategoryId: meliCategoryId || existing[0].meliCategoryId,
                meliListingType: meliListingType || existing[0].meliListingType,
                syncEnabled: applySync,
                packQuantity: quantity,
                updatedAt: new Date(),
            }).where(eq(meliItemLinks.id, existing[0].id));
        } else {
            // Nuevo link
            await db.insert(meliItemLinks).values({
                productId: parsedProductId,
                meliItemId,
                meliVariationId: meliVariationId || null,
                meliTitle,
                meliCategoryId,
                meliListingType,
                syncEnabled: applySync,
                packQuantity: quantity
            });
        }

        // Reprocesamos también ventas ya vinculadas para actualizar producto, pack y snapshots.
        const importedOrders = await db.select().from(meliOrders);
        const affectedOrders = importedOrders.filter(order => order.items?.some(item =>
            item.meliItemId === meliItemId &&
            (!meliVariationId || item.variationId === String(meliVariationId))
        ));
        let reprocessedOrders = 0;
        let reprocessErrors = 0;
        for (const affectedOrder of affectedOrders) {
            const outcome = await MeliService.importOrder(affectedOrder.meliOrderId);
            if (outcome.success) reprocessedOrders++;
            else reprocessErrors++;
        }

        return new Response(JSON.stringify({ success: true, reprocessedOrders, reprocessErrors }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('Error linking listing:', e);
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
