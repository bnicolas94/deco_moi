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

    static async calculateMeliPriceForProduct(productId: number): Promise<number | null> {
        const productData = await db.select().from(products).where(eq(products.id, productId)).limit(1);
        if (!productData.length) return null;

        // Obtener costos específicos del producto
        const pCosts = await db.select({
            name: costItems.name,
            type: costItems.type,
            value: costItems.value,
            isActive: costItems.isActive
        }).from(productCostItems)
            .innerJoin(costItems, eq(productCostItems.costItemId, costItems.id))
            .where(eq(productCostItems.productId, productId));

        // Obtener costos globales activos
        const gCosts = await db.select().from(costItems).where(
            and(eq(costItems.isActive, true), eq(costItems.isGlobal, true))
        );

        // Merge: costos del producto + globales (sin duplicar por nombre)
        let allCosts = [...pCosts.filter(c => c.isActive).map(c => ({ name: c.name, type: c.type, value: Number(c.value) }))];
        gCosts.forEach(gc => {
            if (!allCosts.some(p => p.name === gc.name)) {
                allCosts.push({ name: gc.name, type: gc.type, value: Number(gc.value) });
            }
        });

        // Calcular neto y fijo a partir del basePrice y sus costos
        let neto = Number(productData[0].basePrice);
        let fijo = 0;
        allCosts.forEach(cost => {
            if (cost.type === 'percentage') {
                neto -= neto * (cost.value / 100);
            } else {
                fijo += cost.value;
            }
        });

        const inversionTotal = neto + fijo; // Base real para cálculo ML

        // Config global de ML
        const configData = await db.select().from(meliPricingConfig).where(eq(meliPricingConfig.scope, 'global')).limit(1);
        const config = configData.length > 0 ? configData[0] : null;

        if (!config) throw new Error("No global pricing config found");

        return calculateMeliPrice(inversionTotal, config as MeliPricingConfigType);
    }

    // ── SYNCHRONIZATION ───────────────────────────────────────

    static async syncPrice(productId: number): Promise<{ success: boolean; error?: string }> {
        try {
            const link = await db.select().from(meliItemLinks).where(eq(meliItemLinks.productId, productId)).limit(1);
            if (!link.length || !link[0].syncEnabled) {
                return { success: false, error: 'Product not linked or sync disabled' };
            }

            const meliItemId = link[0].meliItemId;
            const newPrice = await this.calculateMeliPriceForProduct(productId);

            if (newPrice === null) return { success: false, error: 'Product price calc failed' };

            await updateMeliItem(meliItemId, { price: newPrice });

            await db.update(meliItemLinks).set({
                lastSyncedPrice: newPrice.toString(),
                lastSyncAt: new Date(),
            }).where(eq(meliItemLinks.id, link[0].id));

            await db.insert(meliSyncLog).values({
                type: 'price_sync',
                direction: 'push',
                productId,
                meliItemId,
                status: 'success',
            });

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

            const link = await db.select().from(meliItemLinks).where(eq(meliItemLinks.productId, productId)).limit(1);
            if (!link.length || !link[0].syncEnabled) {
                return { success: false, error: 'Product not linked or sync disabled' };
            }

            const meliItemId = link[0].meliItemId;
            const stock = productData[0].stock ?? 0;

            await updateMeliItem(meliItemId, { available_quantity: stock });

            await db.update(meliItemLinks).set({
                lastSyncedStock: stock,
                lastSyncAt: new Date(),
            }).where(eq(meliItemLinks.id, link[0].id));

            await db.insert(meliSyncLog).values({
                type: 'stock_sync',
                direction: 'push',
                productId,
                meliItemId,
                status: 'success',
            });

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

}
