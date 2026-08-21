import type { APIContext } from 'astro';
import { db } from '../../../lib/db/connection';
import { meliItemLinks, meliOrders } from '../../../lib/db/schema';
import { eq, and, isNull, ne } from 'drizzle-orm';
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

        const quantity = Number(packQuantity) || 1;

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
                productId: Number(productId),
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
                productId: Number(productId),
                meliItemId,
                meliVariationId: meliVariationId || null,
                meliTitle,
                meliCategoryId,
                meliListingType,
                syncEnabled: applySync,
                packQuantity: quantity
            });
        }

        // Una venta que había quedado sin vincular puede entrar ahora en Rentabilidad.
        const pendingOrders = await db.select().from(meliOrders).where(ne(meliOrders.mappingStatus, 'mapped'));
        const affectedOrders = pendingOrders.filter(order => order.items?.some(item =>
            item.meliItemId === meliItemId &&
            (!meliVariationId || item.variationId === String(meliVariationId))
        ));
        for (const pendingOrder of affectedOrders) {
            await MeliService.importOrder(pendingOrder.meliOrderId);
        }

        return new Response(JSON.stringify({ success: true, reprocessedOrders: affectedOrders.length }), {
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
