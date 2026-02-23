import { db } from '../db/connection';
import { eq, desc, and } from 'drizzle-orm';
import {
    meliPricingConfig,
    meliItemLinks,
    meliSyncLog,
    meliOrders,
    meliCredentials,
    products,
    costItems,
    productCostItems
} from '../db/schema';
import { PricingService } from './PricingService';
import { getAuthUrl, exchangeCodeForToken } from '../integrations/mercadolibre/auth';
import { calculateMeliPrice, getPriceBreakdown } from '../integrations/mercadolibre/pricing';
import { getMeliItem, getListingPrices, updateMeliItem } from '../integrations/mercadolibre/items';
import { getMeliOrder, searchMeliOrders } from '../integrations/mercadolibre/orders';
import type { MeliPricingConfigType } from '../integrations/mercadolibre/pricing';

export class MeliService {

    // ── AUTHENTICATION ──────────────────────────────────────────

    static async getAuthorizationUrl(): Promise<string> {
        return getAuthUrl();
    }

    static async handleAuthCallback(code: string) {
        const tokens = await exchangeCodeForToken(code);
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000 - tzOffset); // basic calc

        const appId = import.meta.env.MELI_APP_ID || process.env.MELI_APP_ID;

        // Desactivamos anteriores
        await db.update(meliCredentials).set({ isActive: false });

        // Insertamos la nueva (manejo de Test Users sin refresh_token)
        await db.insert(meliCredentials).values({
            mlUserId: String(tokens.user_id),
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || 'no_refresh_token_provided',
            expiresAt: expiresAt,
            appId: appId as string,
            isActive: true
        });

        return tokens;
    }

    // ── PRICING ───────────────────────────────────────────────

    static async calculateMeliPriceForProduct(productId: number, quantity: number = 1): Promise<number | null> {
        const productData = await db.select().from(products).where(eq(products.id, productId)).limit(1);
        if (!productData.length) return null;

        const { totalFixed, totalPerc } = await PricingService.getProductCostBreakdown(productId);

        const gross = parseFloat(productData[0].basePrice.toString());
        const netoDeseado = gross - totalFixed - (gross * (totalPerc / 100));

        // Inversión base multiplicada por la cantidad del pack
        const inversionTotal = (netoDeseado + totalFixed) * quantity;

        // Config global de ML
        const configData = await db.select().from(meliPricingConfig).where(eq(meliPricingConfig.scope, 'global')).limit(1);
        const config = configData.length > 0 ? configData[0] : null;

        if (!config) throw new Error("No global pricing config found");

        return calculateMeliPrice(inversionTotal, config as MeliPricingConfigType);
    }

    // ── SYNCHRONIZATION ───────────────────────────────────────

    static async syncPrice(productId: number): Promise<{ success: boolean; error?: string }> {
        try {
            const links = await db.select().from(meliItemLinks).where(and(eq(meliItemLinks.productId, productId), eq(meliItemLinks.syncEnabled, true)));
            if (!links.length) {
                return { success: false, error: 'Product not linked or sync disabled' };
            }

            for (const link of links) {
                const quantity = link.packQuantity || 1;
                const newPrice = await this.calculateMeliPriceForProduct(productId, quantity);
                if (newPrice === null) continue;

                await updateMeliItem(link.meliItemId, {
                    price: newPrice,
                    variationId: link.meliVariationId
                });

                await db.update(meliItemLinks).set({
                    lastSyncedPrice: newPrice.toString(),
                    lastSyncAt: new Date(),
                }).where(eq(meliItemLinks.id, link.id));

                await db.insert(meliSyncLog).values({
                    type: 'price_sync',
                    direction: 'push',
                    productId,
                    meliItemId: link.meliItemId,
                    status: 'success',
                    details: { variationId: link.meliVariationId }
                });
            }

            return { success: true };
        } catch (e: any) {
            console.error(e);
            await db.insert(meliSyncLog).values({
                type: 'price_sync',
                direction: 'push',
                productId,
                status: 'error',
                errorMessage: e.message
            });
            return { success: false, error: e.message };
        }
    }

    static async syncStock(productId: number): Promise<{ success: boolean; error?: string }> {
        try {
            const productData = await db.select().from(products).where(eq(products.id, productId)).limit(1);
            if (!productData.length) return { success: false, error: 'Product not found' };

            const links = await db.select().from(meliItemLinks).where(and(eq(meliItemLinks.productId, productId), eq(meliItemLinks.syncEnabled, true)));
            if (!links.length) {
                return { success: false, error: 'Product not linked or sync disabled' };
            }

            const stock = Number(productData[0].stock) || 0;

            for (const link of links) {
                await updateMeliItem(link.meliItemId, {
                    available_quantity: stock,
                    variationId: link.meliVariationId
                });

                await db.update(meliItemLinks).set({
                    lastSyncedStock: stock,
                    lastSyncAt: new Date(),
                }).where(eq(meliItemLinks.id, link.id));

                await db.insert(meliSyncLog).values({
                    type: 'stock_sync',
                    direction: 'push',
                    productId,
                    meliItemId: link.meliItemId,
                    status: 'success',
                    details: { variationId: link.meliVariationId }
                });
            }

            return { success: true };
        } catch (e: any) {
            console.error(e);
            await db.insert(meliSyncLog).values({
                type: 'stock_sync',
                direction: 'push',
                productId,
                status: 'error',
                errorMessage: e.message
            });
            return { success: false, error: e.message };
        }
    }

    // ── ORDERS IMPORT ─────────────────────────────────────────

    static async importOrder(meliOrderId: string): Promise<boolean> {
        try {
            const existing = await db.select().from(meliOrders).where(eq(meliOrders.meliOrderId, meliOrderId)).limit(1);
            if (existing.length > 0) return false; // already imported

            const orderData = await getMeliOrder(meliOrderId);

            const configData = await db.select().from(meliPricingConfig).where(eq(meliPricingConfig.scope, 'global')).limit(1);
            const config = configData[0] as MeliPricingConfigType;

            let totalCommissions = 0;
            const itemsMapped = orderData.order_items.map(item => {
                totalCommissions += item.sale_fee;
                return {
                    meliItemId: item.item.id,
                    title: item.item.title,
                    sku: item.item.seller_sku,
                    quantity: item.quantity,
                    unitPrice: item.unit_price,
                    productId: null // TODO: Try to map via SKU or meliItemLinks
                };
            });

            const netAmount = orderData.total_amount - totalCommissions;

            await db.insert(meliOrders).values({
                meliOrderId: String(orderData.id),
                status: orderData.status,
                buyerNickname: orderData.buyer.nickname,
                buyerEmail: orderData.buyer.email,
                totalAmount: String(orderData.total_amount),
                netAmount: String(netAmount),
                mlCommissionAmount: String(totalCommissions),
                currency: orderData.currency_id,
                items: itemsMapped,
                dateCreated: new Date(orderData.date_created),
                rawData: orderData
            });

            return true;
        } catch (e) {
            console.error(`Error importing order ${meliOrderId}`, e);
            return false;
        }
    }

    static async importRecentOrders(): Promise<{ imported: number, errors: number }> {
        const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true)).limit(1);
        if (!creds.length) return { imported: 0, errors: 0 };

        try {
            const searchData = await searchMeliOrders({ sellerId: creds[0].mlUserId, limit: 20 });
            let imported = 0;
            let errors = 0;

            if (searchData.results) {
                for (const result of searchData.results) {
                    const success = await this.importOrder(String(result.id));
                    // If 'success' is true it means it was newly imported, else skip (false)
                    if (success) imported++;
                }
            }

            return { imported, errors };
        } catch (e) {
            console.error(e);
            return { imported: 0, errors: 1 };
        }
    }

    static async getLatestMeliData(itemIds: string[]): Promise<Map<string, { price: number; status: string }>> {
        if (!itemIds.length) return new Map();

        const results = new Map<string, { price: number; status: string }>();
        const uniqueIds = [...new Set(itemIds)].filter(id => id && id.trim() !== '');

        if (!uniqueIds.length) return results;

        // ML permite hasta 20 IDs por request en /items?ids=
        for (let i = 0; i < uniqueIds.length; i += 20) {
            const chunk = uniqueIds.slice(i, i + 20);
            try {
                const { getValidAccessToken } = await import('../integrations/mercadolibre/auth');
                const accessToken = await getValidAccessToken();
                const url = `https://api.mercadolibre.com/items?ids=${chunk.join(',')}`;

                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    data.forEach((res: any) => {
                        if (res.code === 200 && res.body) {
                            results.set(res.body.id, {
                                price: res.body.price,
                                status: res.body.status
                            });
                        }
                    });
                } else {
                    console.error(`ML API Error (${response.status}):`, await response.text());
                }
            } catch (e) {
                console.error('Error fetching live data batch:', e);
            }
        }
        return results;
    }

}
