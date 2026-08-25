import { db } from '../db/connection';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import {
    meliPricingConfig,
    meliItemLinks,
    meliSyncLog,
    meliOrders,
    meliCredentials,
    products,
    productVariants,
    orders,
    orderItems,
    orderItemCosts,
    payments
} from '../db/schema';
import { CostSnapshotService } from './CostSnapshotService';
import { getAuthUrl, exchangeCodeForToken } from '../integrations/mercadolibre/auth';
import { calculateMeliPrice, getFixedCostForPrice } from '../integrations/mercadolibre/pricing';
import { getMeliItem, getListingPrices, updateMeliItem } from '../integrations/mercadolibre/items';
import { getMeliOrder, searchMeliOrders } from '../integrations/mercadolibre/orders';
import { getMeliShipment } from '../integrations/mercadolibre/shipments';
import {
    allocateMoney,
    getEstimatedShippingCost,
    getLineSaleFeeTotal,
    getOrderMarketplaceFee,
    getSellerShippingCost,
} from '../integrations/mercadolibre/financials';
import { allocateOrderLineRevenue, planOrderItemSync } from '../integrations/mercadolibre/order-sync';
import type { MeliPricingConfigType } from '../integrations/mercadolibre/pricing';

interface MarketplaceOrderFinancials {
    marketplaceFeeAmount: number;
    taxesAmount: number;
    shippingSellerCost: number;
    shippingIsEstimated: boolean;
}

export class MeliService {

    // ── AUTHENTICATION ──────────────────────────────────────────

    static async getAuthorizationUrl(): Promise<string> {
        return getAuthUrl();
    }

    static async handleAuthCallback(code: string) {
        const tokens = await exchangeCodeForToken(code);
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

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

    static async calculateMeliPriceForProduct(productId: number, quantity: number = 1, link?: {
        meliItemId?: string;
        meliCategoryId?: string | null;
        meliListingType?: string | null;
    }): Promise<number | null> {
        const productData = await db.select().from(products).where(eq(products.id, productId)).limit(1);
        if (!productData.length) return null;

        // El precio de la app ya contiene costos internos y ganancia. Para conservar
        // ese ingreso objetivo en ML, se agregan encima los costos propios del canal.
        const targetAppRevenue = parseFloat(productData[0].basePrice.toString()) * quantity;

        const productConfig = await db.select().from(meliPricingConfig).where(and(
            eq(meliPricingConfig.scope, 'product'),
            eq(meliPricingConfig.scopeId, String(productId)),
            eq(meliPricingConfig.isActive, true)
        )).limit(1);
        const categoryConfig = link?.meliCategoryId ? await db.select().from(meliPricingConfig).where(and(
            eq(meliPricingConfig.scope, 'category'),
            eq(meliPricingConfig.scopeId, link.meliCategoryId),
            eq(meliPricingConfig.isActive, true)
        )).limit(1) : [];
        const globalConfig = await db.select().from(meliPricingConfig).where(and(
            eq(meliPricingConfig.scope, 'global'),
            eq(meliPricingConfig.isActive, true)
        )).limit(1);
        const config = productConfig[0] || categoryConfig[0] || globalConfig[0] || null;

        if (!config) throw new Error("No global pricing config found");

        let proposedPrice = calculateMeliPrice(targetAppRevenue, config as MeliPricingConfigType);

        // Cuando conocemos la publicación, priorizamos el cotizador oficial. Si
        // falla o faltan datos, conservamos la configuración manual como fallback.
        if (link?.meliCategoryId && link?.meliListingType) {
            try {
                let mlItem: any = null;
                if (link.meliItemId) mlItem = await getMeliItem(link.meliItemId);
                for (let attempt = 0; attempt < 3; attempt++) {
                    const quoteRaw: any = await getListingPrices(proposedPrice, link.meliListingType, {
                        categoryId: link.meliCategoryId,
                        logisticType: mlItem?.shipping?.logistic_type,
                        shippingMode: mlItem?.shipping?.mode,
                        billableWeight: productData[0].weight ? productData[0].weight * quantity : null,
                    });
                    const quotes = Array.isArray(quoteRaw?.[0]) ? quoteRaw.flat() : quoteRaw;
                    const quote = quotes?.find((entry: any) => entry.listing_type_id === link.meliListingType) || quotes?.[0];
                    if (!quote) break;
                    const officialFees = Number(quote.sale_fee_amount || 0) + Number(quote.free_shipping_fee_amount || 0);
                    const otherRate = (
                        Number(config.extraMarginPct || 0) +
                        Number(config.mpCommissionPct || 0) +
                        Number(config.grossIncomeTaxPct || 0)
                    ) / 100;
                    if (otherRate >= 1) break;
                    const nextPrice = Math.ceil((targetAppRevenue + officialFees) / (1 - otherRate));
                    if (Math.abs(nextPrice - proposedPrice) <= 1) {
                        proposedPrice = nextPrice;
                        break;
                    }
                    proposedPrice = nextPrice;
                }
            } catch (error) {
                console.warn('[Meli Pricing] No se pudo usar el cotizador oficial; se usa configuración local.', error);
            }
        }

        return proposedPrice;
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
                const newPrice = await this.calculateMeliPriceForProduct(productId, quantity, link);
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

    private static async resolveOrderItem(item: any) {
        const variationId = item.item.variation_id ? String(item.item.variation_id) : null;
        let links = await db.select().from(meliItemLinks).where(and(
            eq(meliItemLinks.meliItemId, item.item.id),
            variationId ? eq(meliItemLinks.meliVariationId, variationId) : isNull(meliItemLinks.meliVariationId)
        )).limit(1);

        if (links.length === 0 && variationId) {
            links = await db.select().from(meliItemLinks).where(and(
                eq(meliItemLinks.meliItemId, item.item.id),
                isNull(meliItemLinks.meliVariationId)
            )).limit(1);
        }

        let productId: number | null = links[0]?.productId || null;
        let variantId: number | null = null;
        let packQuantity = links[0]?.packQuantity || 1;

        if (!productId && item.item.seller_sku) {
            const product = await db.select().from(products).where(eq(products.sku, item.item.seller_sku)).limit(1);
            if (product.length > 0) {
                productId = product[0].id;
            } else {
                const variant = await db.select().from(productVariants).where(eq(productVariants.sku, item.item.seller_sku)).limit(1);
                if (variant.length > 0) {
                    productId = variant[0].productId;
                    variantId = variant[0].id;
                }
            }
        }

        return {
            meliItemId: item.item.id,
            variationId,
            title: item.item.title,
            sku: item.item.seller_sku,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            grossPrice: Number(item.gross_price || item.full_unit_price * item.quantity || item.unit_price * item.quantity),
            saleFeePerUnit: Number(item.sale_fee || 0),
            saleFee: getLineSaleFeeTotal(item),
            productId,
            variantId,
            packQuantity,
            internalUnits: item.quantity * packQuantity,
        };
    }

    private static getTaxesAmount(orderData: any): number {
        if (typeof orderData.taxes === 'number') return Number(orderData.taxes);
        return Number(orderData.taxes?.amount || 0);
    }

    private static async getOrderFinancials(orderData: any, config: any): Promise<MarketplaceOrderFinancials> {
        const marketplaceFeeAmount = getOrderMarketplaceFee(orderData);
        const taxesAmount = this.getTaxesAmount(orderData);
        let shippingSellerCost = 0;
        let shippingIsEstimated = false;

        if (orderData.shipping?.id) {
            try {
                const shipment = await getMeliShipment(orderData.shipping.id);
                const actualShippingCost = getSellerShippingCost(shipment);
                if (actualShippingCost !== null) {
                    shippingSellerCost = actualShippingCost;
                } else {
                    shippingSellerCost = getEstimatedShippingCost(Number(orderData.total_amount || 0), config || {});
                    shippingIsEstimated = shippingSellerCost > 0;
                }
            } catch (error) {
                shippingSellerCost = getEstimatedShippingCost(Number(orderData.total_amount || 0), config || {});
                shippingIsEstimated = shippingSellerCost > 0;
                console.warn(`[Meli Shipping] No se pudo obtener el costo real del envío ${orderData.shipping.id}; se usa estimación.`, error);
            }
        }

        return {
            marketplaceFeeAmount,
            taxesAmount,
            shippingSellerCost,
            shippingIsEstimated,
        };
    }

    private static getInternalStatuses(orderData: any) {
        const isPaid = orderData.status === 'paid' || orderData.payments?.some((payment: any) => payment.status === 'approved');
        const isCancelled = orderData.status === 'cancelled';
        return {
            isPaid,
            isCancelled,
            orderStatus: isCancelled ? 'cancelled' : (isPaid ? 'confirmed' : 'pending'),
            paymentStatus: isCancelled ? (isPaid ? 'refunded' : 'rejected') : (isPaid ? 'approved' : 'pending'),
            paidAt: isPaid
                ? new Date(orderData.payments?.find((payment: any) => payment.date_approved)?.date_approved || orderData.date_closed || orderData.date_created)
                : null,
            cancelledAt: isCancelled ? new Date(orderData.cancel_detail?.date || Date.now()) : null,
        };
    }

    private static async replaceMarketplaceCosts(
        internalItems: Array<any>,
        mappedItems: Array<any>,
        orderData: any,
        config: any,
        financials: MarketplaceOrderFinancials,
        database: any = db
    ) {
        if (internalItems.length === 0) return;
        const internalItemIds = internalItems.map(item => item.id);
        await database.delete(orderItemCosts).where(and(
            inArray(orderItemCosts.orderItemId, internalItemIds),
            inArray(orderItemCosts.source, ['marketplace_order_api', 'channel_estimate'])
        ));
        const existingCostRows = await database.select({
            orderItemId: orderItemCosts.orderItemId,
            category: orderItemCosts.category,
            source: orderItemCosts.source,
        }).from(orderItemCosts).where(inArray(orderItemCosts.orderItemId, internalItemIds));
        const itemsWithConfiguredTax = new Set(existingCostRows.filter((row: any) => row.category === 'tax').map((row: any) => row.orderItemId));
        const itemsWithConfiguredPaymentFee = new Set(existingCostRows.filter((row: any) => row.category === 'payment_fee').map((row: any) => row.orderItemId));
        const reconciledItemsByCategory = (category: string) => new Set(existingCostRows
            .filter((row: any) => row.category === category && row.source === 'billing_reconciliation')
            .map((row: any) => row.orderItemId));
        const itemsWithReconciledMarketplaceFee = reconciledItemsByCategory('marketplace_fee');
        const itemsWithReconciledTax = reconciledItemsByCategory('tax');
        const itemsWithReconciledPaymentFee = reconciledItemsByCategory('payment_fee');
        const itemsWithReconciledShipping = reconciledItemsByCategory('shipping_fee');

        const feeWeights = mappedItems.map(item => Number(item.saleFee || 0));
        const revenueWeights = mappedItems.map(item => Number(item.unitPrice || 0) * Number(item.quantity || 0));
        const marketplaceFeeAllocations = allocateMoney(
            financials.marketplaceFeeAmount,
            feeWeights.some(weight => weight > 0) ? feeWeights : revenueWeights
        );
        const taxAllocations = allocateMoney(financials.taxesAmount, revenueWeights);
        const shippingAllocations = allocateMoney(financials.shippingSellerCost, revenueWeights);
        const syncPlan = planOrderItemSync(internalItems, mappedItems);
        const mappedIndexByInternalId = new Map(syncPlan.matches.map(match => [match.existingId, match.desiredIndex]));
        const rows: typeof orderItemCosts.$inferInsert[] = [];

        for (const internalItem of internalItems) {
            const mappedIndex = mappedIndexByInternalId.get(internalItem.id);
            if (mappedIndex === undefined) continue;
            const mapped = mappedItems[mappedIndex];

            const lineRevenue = Number(internalItem.netRevenue || mapped.unitPrice * mapped.quantity);
            const actualSaleFee = marketplaceFeeAllocations[mappedIndex] || 0;
            const effectiveRate = lineRevenue > 0 ? actualSaleFee / lineRevenue * 100 : 0;
            const estimatedPercentage = lineRevenue * (Number(config?.commissionPct || 0) / 100);
            const estimatedFinancing = lineRevenue * (Number(config?.installmentsCostPct || 0) / 100);
            const estimatedFixed = getFixedCostForPrice(mapped.unitPrice, config || {}) * mapped.quantity;

            if (actualSaleFee > 0 && !itemsWithReconciledMarketplaceFee.has(internalItem.id)) {
                rows.push({
                    orderItemId: internalItem.id,
                    costItemName: 'Cargo por venta Mercado Libre',
                    costItemType: 'percentage',
                    configuredValue: effectiveRate.toFixed(2),
                    calculatedAmount: actualSaleFee.toFixed(2),
                    costCode: 'ml_sale_fee_total',
                    category: 'marketplace_fee',
                    nature: 'variable',
                    calculationBasis: 'actual_order_fee',
                    source: 'marketplace_order_api',
                    salesChannel: 'mercadolibre',
                    isEstimated: false,
                    affectsProfit: true,
                    externalReference: String(orderData.id),
                    effectiveAt: new Date(orderData.date_created),
                });
            }

            const feeDetails = [
                ['ml_percentage_fee', 'Comisión porcentual ML (estimada)', 'percentage', Number(config?.commissionPct || 0), estimatedPercentage],
                ['ml_fixed_fee', 'Cargo fijo ML (estimado)', 'fixed', estimatedFixed, estimatedFixed],
                ['ml_financing_fee', 'Financiación/cuotas ML (estimada)', 'percentage', Number(config?.installmentsCostPct || 0), estimatedFinancing],
            ] as const;
            for (const [code, name, type, configuredValue, amount] of feeDetails) {
                if (amount <= 0) continue;
                rows.push({
                    orderItemId: internalItem.id,
                    costItemName: name,
                    costItemType: type,
                    configuredValue: Number(configuredValue).toFixed(2),
                    calculatedAmount: Number(amount).toFixed(2),
                    costCode: code,
                    category: 'marketplace_fee_detail',
                    nature: type === 'fixed' ? 'fixed' : 'variable',
                    calculationBasis: type === 'fixed' ? 'per_marketplace_unit' : 'percent_net_revenue',
                    source: 'channel_estimate',
                    salesChannel: 'mercadolibre',
                    isEstimated: true,
                    affectsProfit: false,
                    parentCostCode: 'ml_sale_fee_total',
                    externalReference: String(orderData.id),
                });
            }

            const allocatedTaxes = taxAllocations[mappedIndex] || 0;
            if (allocatedTaxes > 0 && !itemsWithReconciledTax.has(internalItem.id)) {
                rows.push({
                    orderItemId: internalItem.id,
                    costItemName: 'Impuestos informados por ML',
                    costItemType: 'fixed',
                    configuredValue: '0',
                    calculatedAmount: allocatedTaxes.toFixed(2),
                    costCode: 'ml_order_taxes',
                    category: 'tax',
                    nature: 'variable',
                    calculationBasis: 'actual_order_tax',
                    source: 'marketplace_order_api',
                    salesChannel: 'mercadolibre',
                    isEstimated: false,
                    affectsProfit: true,
                    externalReference: String(orderData.id),
                });
            } else if (Number(config?.grossIncomeTaxPct || 0) > 0 && !itemsWithConfiguredTax.has(internalItem.id)) {
                const rate = Number(config.grossIncomeTaxPct);
                rows.push({
                    orderItemId: internalItem.id,
                    costItemName: 'Ingresos Brutos (estimado)',
                    costItemType: 'percentage',
                    configuredValue: rate.toFixed(2),
                    calculatedAmount: (lineRevenue * rate / 100).toFixed(2),
                    costCode: 'gross_income_tax_estimate',
                    category: 'tax',
                    nature: 'variable',
                    calculationBasis: 'percent_net_revenue',
                    source: 'channel_estimate',
                    salesChannel: 'mercadolibre',
                    isEstimated: true,
                    affectsProfit: true,
                    externalReference: String(orderData.id),
                });
            }

            if (
                Number(config?.mpCommissionPct || 0) > 0
                && !itemsWithConfiguredPaymentFee.has(internalItem.id)
                && !itemsWithReconciledPaymentFee.has(internalItem.id)
            ) {
                const rate = Number(config.mpCommissionPct);
                rows.push({
                    orderItemId: internalItem.id,
                    costItemName: 'Comisión Mercado Pago (estimada)',
                    costItemType: 'percentage',
                    configuredValue: rate.toFixed(2),
                    calculatedAmount: (lineRevenue * rate / 100).toFixed(2),
                    costCode: 'mp_fee_estimate',
                    category: 'payment_fee',
                    nature: 'variable',
                    calculationBasis: 'percent_net_revenue',
                    source: 'channel_estimate',
                    salesChannel: 'mercadolibre',
                    isEstimated: true,
                    affectsProfit: true,
                    externalReference: String(orderData.id),
                });
            }

            const allocatedShipping = shippingAllocations[mappedIndex] || 0;
            if (allocatedShipping > 0 && !itemsWithReconciledShipping.has(internalItem.id)) {
                rows.push({
                    orderItemId: internalItem.id,
                    costItemName: financials.shippingIsEstimated
                        ? 'Mercado Envíos (estimado)'
                        : 'Costo vendedor de Mercado Envíos',
                    costItemType: 'fixed',
                    configuredValue: allocatedShipping.toFixed(2),
                    calculatedAmount: allocatedShipping.toFixed(2),
                    costCode: 'ml_shipping_seller_cost',
                    category: 'shipping_fee',
                    nature: 'variable',
                    calculationBasis: financials.shippingIsEstimated ? 'configured_shipping_estimate' : 'actual_shipment_cost',
                    source: financials.shippingIsEstimated ? 'channel_estimate' : 'marketplace_order_api',
                    salesChannel: 'mercadolibre',
                    isEstimated: financials.shippingIsEstimated,
                    affectsProfit: true,
                    externalReference: orderData.shipping?.id ? String(orderData.shipping.id) : String(orderData.id),
                    effectiveAt: new Date(orderData.date_created),
                });
            }
        }

        if (rows.length > 0) await database.insert(orderItemCosts).values(rows);
    }

    private static buildInternalItemsInput(orderId: string, resolvedItems: Array<any>, orderData: any) {
        const lineRevenues = resolvedItems.map(item => Number(item.unitPrice || 0) * Number(item.quantity || 0));
        const netRevenues = allocateOrderLineRevenue(Number(orderData.total_amount || 0), lineRevenues);

        return resolvedItems.map((item, index) => {
            const lineRevenue = lineRevenues[index] || 0;
            const netRevenue = netRevenues[index] || 0;
            return {
                orderId,
                productId: item.productId!,
                productName: item.title,
                productSku: item.sku,
                quantity: item.quantity,
                unitPrice: String(item.unitPrice),
                subtotal: String(lineRevenue),
                variantId: item.variantId,
                externalItemId: item.meliItemId,
                externalVariationId: item.variationId,
                packQuantity: item.packQuantity,
                internalUnits: item.internalUnits,
                grossAmount: String(item.grossPrice),
                discountAmount: String(Math.max(0, item.grossPrice - netRevenue)),
                netRevenue: String(netRevenue),
            };
        });
    }

    private static async syncExistingInternalOrder(
        internalOrder: typeof orders.$inferSelect,
        meliOrder: typeof meliOrders.$inferSelect,
        resolvedItems: Array<any>,
        orderData: any,
        statuses: ReturnType<typeof MeliService.getInternalStatuses>,
        config: any,
        financials: MarketplaceOrderFinancials,
        database: any
    ) {
        const desiredItems = this.buildInternalItemsInput(internalOrder.id, resolvedItems, orderData);
        const lineSubtotal = desiredItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
        const discountAmount = Math.max(0, lineSubtotal - Number(orderData.total_amount || 0));

        const tx = database;
        await tx.update(orders).set({
            status: statuses.orderStatus,
            paymentStatus: statuses.paymentStatus,
            externalStatus: orderData.status,
            paidAt: statuses.paidAt,
            cancelledAt: statuses.cancelledAt,
            subtotal: String(lineSubtotal),
            discountAmount: String(discountAmount),
            total: String(orderData.total_amount),
            shippingMethod: orderData.shipping?.id ? 'delivery' : 'pickup',
            shippingData: orderData.shipping ? { mercadoLibre: orderData.shipping } : null,
            updatedAt: new Date(),
        }).where(eq(orders.id, internalOrder.id));

        const existingItems: Array<typeof orderItems.$inferSelect> = await tx.select()
            .from(orderItems)
            .where(eq(orderItems.orderId, internalOrder.id));
        const syncPlan = planOrderItemSync(existingItems, resolvedItems);
        const existingById = new Map<number, typeof orderItems.$inferSelect>(
            existingItems.map(item => [item.id, item])
        );
        const synchronizedItems: Array<typeof orderItems.$inferSelect> = [];
        const preserveSnapshotItems: Array<typeof orderItems.$inferSelect> = [];
        const rebuildSnapshotItems: Array<typeof orderItems.$inferSelect> = [];

        for (const match of syncPlan.matches) {
            const existingItem = existingById.get(match.existingId)!;
            const desiredItem = desiredItems[match.desiredIndex];
            const productChanged = existingItem.productId !== desiredItem.productId;
            const [updatedItem] = await tx.update(orderItems)
                .set(desiredItem)
                .where(eq(orderItems.id, existingItem.id))
                .returning();
            synchronizedItems.push(updatedItem);
            if (productChanged) rebuildSnapshotItems.push(updatedItem);
            else preserveSnapshotItems.push(updatedItem);
        }

        for (const desiredIndex of syncPlan.insertIndexes) {
            const [insertedItem] = await tx.insert(orderItems).values(desiredItems[desiredIndex]).returning();
            synchronizedItems.push(insertedItem);
            rebuildSnapshotItems.push(insertedItem);
        }

        if (syncPlan.staleExistingIds.length > 0) {
            await tx.delete(orderItemCosts).where(inArray(orderItemCosts.orderItemId, syncPlan.staleExistingIds));
            await tx.delete(orderItems).where(inArray(orderItems.id, syncPlan.staleExistingIds));
        }

        await CostSnapshotService.rescaleExistingCosts(preserveSnapshotItems, tx);
        await CostSnapshotService.replaceConfiguredCosts(rebuildSnapshotItems, 'mercadolibre', {
            database: tx,
            effectiveAt: new Date(orderData.date_created),
        });
        await this.replaceMarketplaceCosts(synchronizedItems, resolvedItems, orderData, config, financials, tx);
        await tx.update(meliOrders).set({ internalOrderId: internalOrder.id }).where(eq(meliOrders.id, meliOrder.id));
    }

    static async importOrder(meliOrderId: string): Promise<{
        success: boolean;
        created: boolean;
        internalCreated: boolean;
        mappingStatus?: string;
        error?: string;
    }> {
        try {
            // External calls and read-only resolution happen before opening the DB transaction.
            const orderData = await getMeliOrder(meliOrderId);
            const configData = await db.select().from(meliPricingConfig).where(eq(meliPricingConfig.scope, 'global')).limit(1);
            const config = configData[0] as any;
            const resolvedItems = await Promise.all(orderData.order_items.map(item => this.resolveOrderItem(item)));
            const mappingStatus = resolvedItems.every(item => item.productId)
                ? 'mapped'
                : (resolvedItems.some(item => item.productId) ? 'pending' : 'unmatched');
            const statuses = this.getInternalStatuses(orderData);
            const financials = await this.getOrderFinancials(orderData, config);
            const primaryPayment = orderData.payments?.find(payment => payment.status === 'approved') || orderData.payments?.[0];
            const netAmount = orderData.total_amount
                - financials.marketplaceFeeAmount
                - financials.taxesAmount
                - financials.shippingSellerCost;

            const persistence = await db.transaction(async (tx) => {
                const existing = await tx.select().from(meliOrders)
                    .where(eq(meliOrders.meliOrderId, meliOrderId))
                    .limit(1);
                const [meliOrder] = await tx.insert(meliOrders).values({
                    meliOrderId: String(orderData.id),
                    internalOrderId: existing[0]?.internalOrderId || null,
                    status: orderData.status,
                    buyerNickname: orderData.buyer.nickname,
                    buyerEmail: orderData.buyer.email,
                    totalAmount: String(orderData.total_amount),
                    netAmount: String(netAmount),
                    mlCommissionAmount: String(financials.marketplaceFeeAmount),
                    taxesAmount: String(financials.taxesAmount),
                    shippingSellerCost: String(financials.shippingSellerCost),
                    currency: orderData.currency_id,
                    items: resolvedItems.map(({ variantId: _variantId, grossPrice: _grossPrice, ...item }) => item),
                    paymentId: primaryPayment?.id ? String(primaryPayment.id) : null,
                    shippingId: orderData.shipping?.id ? String(orderData.shipping.id) : null,
                    mappingStatus,
                    financialStatus: existing[0]?.financialStatus || 'provisional',
                    dateCreated: new Date(orderData.date_created),
                    rawData: orderData,
                    updatedAt: new Date(),
                }).onConflictDoUpdate({
                    target: meliOrders.meliOrderId,
                    set: {
                        status: orderData.status,
                        buyerNickname: orderData.buyer.nickname,
                        buyerEmail: orderData.buyer.email,
                        totalAmount: String(orderData.total_amount),
                        netAmount: String(netAmount),
                        mlCommissionAmount: String(financials.marketplaceFeeAmount),
                        taxesAmount: String(financials.taxesAmount),
                        shippingSellerCost: String(financials.shippingSellerCost),
                        currency: orderData.currency_id,
                        items: resolvedItems.map(({ variantId: _variantId, grossPrice: _grossPrice, ...item }) => item),
                        paymentId: primaryPayment?.id ? String(primaryPayment.id) : null,
                        shippingId: orderData.shipping?.id ? String(orderData.shipping.id) : null,
                        mappingStatus,
                        rawData: orderData,
                        updatedAt: new Date(),
                    }
                }).returning();

                let internalOrder = meliOrder.internalOrderId
                    ? await tx.select().from(orders).where(eq(orders.id, meliOrder.internalOrderId)).limit(1).then(rows => rows[0])
                    : await tx.select().from(orders).where(and(
                        eq(orders.salesChannel, 'mercadolibre'),
                        eq(orders.externalOrderId, String(orderData.id))
                    )).limit(1).then(rows => rows[0]);
                let internalCreated = false;

                if (internalOrder) {
                    if (mappingStatus === 'mapped') {
                        await this.syncExistingInternalOrder(
                            internalOrder,
                            meliOrder,
                            resolvedItems,
                            orderData,
                            statuses,
                            config,
                            financials,
                            tx
                        );
                    } else {
                        await tx.update(orders).set({
                            status: statuses.orderStatus,
                            paymentStatus: statuses.paymentStatus,
                            externalStatus: orderData.status,
                            paidAt: statuses.paidAt,
                            cancelledAt: statuses.cancelledAt,
                            total: String(orderData.total_amount),
                            updatedAt: new Date(),
                        }).where(eq(orders.id, internalOrder.id));
                        await tx.update(meliOrders).set({ internalOrderId: internalOrder.id }).where(eq(meliOrders.id, meliOrder.id));
                    }
                } else if (statuses.isPaid && mappingStatus === 'mapped') {
                    const lineSubtotal = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
                    const discountAmount = Math.max(0, lineSubtotal - Number(orderData.total_amount));
                    [internalOrder] = await tx.insert(orders).values({
                        id: crypto.randomUUID(),
                        orderNumber: `ML-${orderData.id}`,
                        status: statuses.orderStatus,
                        subtotal: String(lineSubtotal),
                        discountAmount: String(discountAmount),
                        shippingCost: '0',
                        total: String(orderData.total_amount),
                        paymentMethod: 'mercadopago',
                        paymentStatus: statuses.paymentStatus,
                        salesChannel: 'mercadolibre',
                        externalOrderId: String(orderData.id),
                        externalStatus: orderData.status,
                        financialStatus: 'provisional',
                        paidAt: statuses.paidAt,
                        cancelledAt: statuses.cancelledAt,
                        shippingMethod: orderData.shipping?.id ? 'delivery' : 'pickup',
                        shippingData: orderData.shipping ? { mercadoLibre: orderData.shipping } : null,
                        notes: `Venta importada desde Mercado Libre #${orderData.id}`,
                        createdAt: new Date(orderData.date_created),
                        updatedAt: new Date(),
                    }).returning();

                    const internalItemsInput = this.buildInternalItemsInput(internalOrder.id, resolvedItems, orderData);
                    const insertedItems = await tx.insert(orderItems).values(internalItemsInput).returning();
                    await CostSnapshotService.replaceConfiguredCosts(insertedItems, 'mercadolibre', {
                        database: tx,
                        effectiveAt: new Date(orderData.date_created),
                    });
                    await this.replaceMarketplaceCosts(insertedItems, resolvedItems, orderData, config, financials, tx);
                    if (primaryPayment?.id) {
                        await tx.insert(payments).values({
                            orderId: internalOrder.id,
                            method: 'mercadopago',
                            status: statuses.paymentStatus,
                            amount: String(primaryPayment.total_paid_amount || primaryPayment.transaction_amount || orderData.total_amount),
                            transactionId: String(primaryPayment.id),
                            metadata: { source: 'mercadolibre', orderId: orderData.id },
                        });
                    }
                    await tx.update(meliOrders).set({ internalOrderId: internalOrder.id }).where(eq(meliOrders.id, meliOrder.id));
                    internalCreated = true;
                }

                const created = existing.length === 0;
                await tx.insert(meliSyncLog).values({
                    type: 'order_import',
                    direction: 'pull',
                    meliOrderId: String(orderData.id),
                    status: 'success',
                    details: { mappingStatus, internalOrderId: internalOrder?.id || null, created },
                });
                return { created, internalCreated };
            });

            return { success: true, ...persistence, mappingStatus };
        } catch (e: any) {
            console.error(`Error importing order ${meliOrderId}`, e);
            await db.insert(meliSyncLog).values({
                type: 'order_import',
                direction: 'pull',
                meliOrderId,
                status: 'error',
                errorMessage: e.message,
            }).catch(() => undefined);
            return { success: false, created: false, internalCreated: false, error: e.message };
        }
    }

    static async importRecentOrders(): Promise<{ imported: number, updated: number, errors: number, unmatched: number }> {
        const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true)).limit(1);
        if (!creds.length) return { imported: 0, updated: 0, errors: 0, unmatched: 0 };

        try {
            let imported = 0;
            let updated = 0;
            let errors = 0;
            let unmatched = 0;
            let offset = 0;
            const limit = 50;

            while (true) {
                const searchData = await searchMeliOrders({ sellerId: creds[0].mlUserId, limit, offset });
                const results = searchData.results || [];
                for (const result of results) {
                    const outcome = await this.importOrder(String(result.id));
                    if (!outcome.success) errors++;
                    else if (outcome.created) imported++;
                    else updated++;
                    if (outcome.mappingStatus !== 'mapped') unmatched++;
                }
                offset += results.length;
                if (results.length < limit || offset >= Number(searchData.paging?.total || 0)) break;
            }

            return { imported, updated, errors, unmatched };
        } catch (e) {
            console.error(e);
            return { imported: 0, updated: 0, errors: 1, unmatched: 0 };
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
