import type { APIContext } from 'astro';
import { db } from '../../../lib/db/connection';
import { meliCredentials, meliItemLinks, products, costItems, productCostItems } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAllSellerItems } from '../../../lib/integrations/mercadolibre/items';

export async function GET({ request }: APIContext) {
    try {
        const url = new URL(request.url);
        const limitStr = url.searchParams.get('limit') || '50';
        const offsetStr = url.searchParams.get('offset') || '0';

        const limit = parseInt(limitStr, 10);
        const offset = parseInt(offsetStr, 10);

        // 1. Get active credential
        const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true)).limit(1);
        if (!creds.length) {
            return new Response(JSON.stringify({ success: false, error: 'No active ML credentials found' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const userId = creds[0].mlUserId;

        // 2. Fetch items from ML
        const mlData = await getAllSellerItems(userId, limit, offset);

        // 3. Get existing links and local specific prices
        const links = await db.select({
            linkId: meliItemLinks.id,
            meliItemId: meliItemLinks.meliItemId,
            productId: meliItemLinks.productId,
            syncEnabled: meliItemLinks.syncEnabled,
            productName: products.name,
            productSku: products.sku,
            basePrice: products.basePrice
        }).from(meliItemLinks)
            .leftJoin(products, eq(meliItemLinks.productId, products.id));

        // Let's also fetch global costs to calculate "Inversión Total" just like the publications table.
        const globalCosts = await db.select().from(costItems).where(
            and(eq(costItems.isActive, true), eq(costItems.isGlobal, true))
        );

        // 4. Map the ML items to include our local data if linked
        const enrichedItems = await Promise.all(mlData.items.map(async (mlItem: any) => {
            const link = links.find(l => l.meliItemId === mlItem.id);
            let localData = null;

            if (link) {
                // Calculate Inversión Total for this linked product
                let inversionTotal = 0;
                if (link.productId) {
                    const pCosts = await db.select({
                        name: costItems.name,
                        type: costItems.type,
                        value: costItems.value,
                        isActive: costItems.isActive,
                    }).from(productCostItems)
                        .innerJoin(costItems, eq(productCostItems.costItemId, costItems.id))
                        .where(eq(productCostItems.productId, link.productId));

                    let allCosts = [...pCosts.filter(c => c.isActive).map(c => ({ name: c.name, type: c.type, value: Number(c.value) }))];
                    globalCosts.forEach(gc => {
                        if (!allCosts.some(p => p.name === gc.name)) {
                            allCosts.push({ name: gc.name, type: gc.type, value: Number(gc.value) });
                        }
                    });

                    let neto = Number(link.basePrice);
                    let fijo = 0;
                    allCosts.forEach(cost => {
                        if (cost.type === 'percentage') {
                            neto -= neto * (cost.value / 100);
                        } else {
                            fijo += cost.value;
                        }
                    });
                    inversionTotal = neto + fijo;
                }

                localData = {
                    productId: link.productId,
                    productName: link.productName,
                    productSku: link.productSku,
                    inversionTotal: inversionTotal,
                    syncEnabled: link.syncEnabled
                };
            }

            return {
                id: mlItem.id,
                title: mlItem.title,
                price: mlItem.price,
                currency_id: mlItem.currency_id,
                available_quantity: mlItem.available_quantity,
                status: mlItem.status,
                permalink: mlItem.permalink,
                thumbnail: mlItem.thumbnail,
                date_created: mlItem.date_created,
                localData: localData
            };
        }));

        return new Response(JSON.stringify({
            success: true,
            paging: mlData.paging,
            items: enrichedItems
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('Error fetching ML listings:', e);
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
