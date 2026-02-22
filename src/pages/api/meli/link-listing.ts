import type { APIContext } from 'astro';
import { db } from '../../../lib/db/connection';
import { meliItemLinks } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getMeliItem } from '../../../lib/integrations/mercadolibre/items';

export async function POST({ request }: APIContext) {
    try {
        const body = await request.json();
        const { meliItemId, productId, syncEnabled } = body;

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

        // Verificar si existe el link, por productId o meliItemId
        // Si el producto actual ya estaba vinculado a OTRO item, se sobreescribe.
        // Si el ML item ya estaba vinculado a OTRO producto local, se re-asigna.

        // Primero buscamos si el producto local ya tiene un enlace
        const existingByProduct = await db.select().from(meliItemLinks).where(eq(meliItemLinks.productId, Number(productId))).limit(1);

        // Segundo buscamos si el ML Item ya tiene un enlace con otro producto
        const existingByMeliItem = await db.select().from(meliItemLinks).where(eq(meliItemLinks.meliItemId, meliItemId)).limit(1);

        const applySync = syncEnabled !== undefined ? syncEnabled : true;

        if (existingByProduct.length > 0) {
            // El producto ya estaba limpiado, lo actualizamos para apuntar al nuevo ML item
            await db.update(meliItemLinks).set({
                meliItemId,
                meliTitle: meliTitle || existingByProduct[0].meliTitle, // mantener si falla
                syncEnabled: applySync,
            }).where(eq(meliItemLinks.id, existingByProduct[0].id));

        } else if (existingByMeliItem.length > 0) {
            // El ML item estaba limpiado a otro producto, reasignar
            await db.update(meliItemLinks).set({
                productId: Number(productId),
                meliTitle: meliTitle || existingByMeliItem[0].meliTitle,
                syncEnabled: applySync,
            }).where(eq(meliItemLinks.id, existingByMeliItem[0].id));
        } else {
            // Nuevo link
            await db.insert(meliItemLinks).values({
                productId: Number(productId),
                meliItemId,
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
