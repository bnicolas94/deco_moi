import type { APIContext } from 'astro';
import { db } from '../../../lib/db/connection';
import { meliItemLinks } from '../../../lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getMeliItem } from '../../../lib/integrations/mercadolibre/items';

export async function POST({ request }: APIContext) {
    try {
        const body = await request.json();
        const { meliItemId, meliVariationId, productId, syncEnabled } = body;

        if (!meliItemId || !productId) {
            return new Response(JSON.stringify({ success: false, error: 'Faltan parámetros: meliItemId o productId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Obtener info del item en ML para guardar el título también
        let meliTitle = '';
        try {
            const mlItem = await getMeliItem(meliItemId);
            meliTitle = mlItem.title;
        } catch (e) {
            console.error('Error obteniendo item ML para título:', e);
            // Seguimos adelante, el título es secundario para funcionar
        }

        // Buscar si ya existe este vínculo específico (meliItemId, meliVariationId)
        // Usamos and() para asegurar que buscamos la combinación exacta.
        // Si meliVariationId es null, buscamos donde sea null en la DB.
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
                syncEnabled: applySync,
                updatedAt: new Date(),
            }).where(eq(meliItemLinks.id, existing[0].id));
        } else {
            // Nuevo link
            await db.insert(meliItemLinks).values({
                productId: Number(productId),
                meliItemId,
                meliVariationId: meliVariationId || null,
                meliTitle,
                syncEnabled: applySync
            });
        }

        return new Response(JSON.stringify({ success: true }), {
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
