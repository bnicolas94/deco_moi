import { and, asc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { meliOrders, orderItemCosts, orderItems, orders } from '@/lib/db/schema';
import { getValidAccessToken } from '@/lib/integrations/mercadolibre/auth';
import { allocateMoney } from '@/lib/integrations/mercadolibre/financials';
import {
    classifyBillingDetail,
    getBillingDetailAmount,
    getBillingDetailItemIds,
    groupBillingDetailsByOrder,
    type BillingCategory,
} from '@/lib/integrations/mercadolibre/billing';

interface ReconciliationResult {
    reconciled: number;
    partial: number;
    skipped: number;
    errors: number;
}

export class BillingReconciliationService {
    static async reconcilePendingOrders(limit = 60): Promise<ReconciliationResult> {
        const pending = await db.select().from(meliOrders).where(and(
            eq(meliOrders.status, 'paid'),
            isNotNull(meliOrders.internalOrderId),
            ne(meliOrders.financialStatus, 'reconciled')
        )).orderBy(asc(meliOrders.updatedAt), asc(meliOrders.dateCreated))
            .limit(Math.min(Math.max(limit, 1), 60));
        return this.reconcileOrders(pending.map(order => order.meliOrderId));
    }

    static async reconcileOrders(orderIds: string[]): Promise<ReconciliationResult> {
        const uniqueOrderIds = [...new Set(orderIds)].slice(0, 60);
        if (uniqueOrderIds.length === 0) return { reconciled: 0, partial: 0, skipped: 0, errors: 0 };

        const candidates = await db.select().from(meliOrders).where(and(
            inArray(meliOrders.meliOrderId, uniqueOrderIds),
            eq(meliOrders.status, 'paid'),
            isNotNull(meliOrders.internalOrderId),
            ne(meliOrders.financialStatus, 'reconciled')
        ));
        const candidatesByOrderId = new Map(candidates.map(order => [order.meliOrderId, order]));
        const pendingOrderIds = uniqueOrderIds.filter(orderId => candidatesByOrderId.has(orderId));
        const alreadySkipped = uniqueOrderIds.length - pendingOrderIds.length;
        if (pendingOrderIds.length === 0) {
            return { reconciled: 0, partial: 0, skipped: alreadySkipped, errors: 0 };
        }

        try {
            const token = await getValidAccessToken();
            const params = new URLSearchParams({ order_ids: pendingOrderIds.join(','), sort_by: 'ID', order_by: 'ASC' });
            const response = await fetch(`https://api.mercadolibre.com/billing/integration/group/ML/order/details?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok && response.status !== 206) {
                throw new Error(`Billing ML respondió ${response.status}: ${await response.text()}`);
            }

            const payload = await response.json();
            if (response.status === 206) {
                const now = new Date();
                const internalOrderIds = candidates
                    .map(order => order.internalOrderId)
                    .filter((orderId): orderId is string => Boolean(orderId));
                await db.transaction(async (tx) => {
                    await tx.update(meliOrders).set({ financialStatus: 'partially_reconciled', updatedAt: now })
                        .where(inArray(meliOrders.meliOrderId, pendingOrderIds));
                    if (internalOrderIds.length > 0) {
                        await tx.update(orders).set({ financialStatus: 'partially_reconciled', updatedAt: now })
                            .where(inArray(orders.id, internalOrderIds));
                    }
                });
                return { reconciled: 0, partial: pendingOrderIds.length, skipped: alreadySkipped, errors: 0 };
            }

            const detailsByOrder = groupBillingDetailsByOrder(payload);
            let reconciled = 0;
            let skipped = alreadySkipped;
            let errors = 0;

            for (const externalOrderId of pendingOrderIds) {
                const meliOrder = candidatesByOrderId.get(externalOrderId);
                if (!meliOrder?.internalOrderId) {
                    skipped++;
                    continue;
                }
                const saleDetails = detailsByOrder.get(externalOrderId) || [];
                if (saleDetails.length === 0) {
                    skipped++;
                    continue;
                }

                const internalItems = await db.select().from(orderItems).where(eq(orderItems.orderId, meliOrder.internalOrderId));
                if (internalItems.length === 0) {
                    skipped++;
                    continue;
                }
                const itemIds = internalItems.map(item => item.id);
                const categoriesFound = new Set<BillingCategory>();
                for (const detail of saleDetails) {
                    if (getBillingDetailAmount(detail) === 0) continue;
                    categoriesFound.add(classifyBillingDetail(
                        detail.charge_info?.transaction_detail || '',
                        detail.charge_info?.detail_sub_type || ''
                    ));
                }

                const rows: typeof orderItemCosts.$inferInsert[] = [];
                for (const detail of saleDetails) {
                    const chargeInfo = detail.charge_info || {};
                    const category = classifyBillingDetail(chargeInfo.transaction_detail || '', chargeInfo.detail_sub_type || '');
                    const signedAmount = getBillingDetailAmount(detail);
                    if (signedAmount === 0) continue;
                    const relatedItemIds = getBillingDetailItemIds(detail, externalOrderId);
                    const targetItems = relatedItemIds.length > 0
                        ? internalItems.filter(item => relatedItemIds.includes(String(item.externalItemId)))
                        : internalItems;
                    const allocatableItems = targetItems.length > 0 ? targetItems : internalItems;
                    const weights = allocatableItems.map(item => Number(item.netRevenue || item.subtotal));
                    const amounts = allocateMoney(signedAmount, weights);

                    allocatableItems.forEach((item, index) => {
                        const amount = amounts[index] || 0;
                        rows.push({
                            orderItemId: item.id,
                            costItemName: chargeInfo.transaction_detail || 'Cargo facturado por Mercado Libre',
                            costItemType: 'fixed',
                            configuredValue: '0',
                            calculatedAmount: amount.toFixed(2),
                            costCode: `billing_${chargeInfo.detail_sub_type || 'detail'}_${chargeInfo.detail_id}`,
                            category,
                            nature: 'variable',
                            calculationBasis: 'billing_actual',
                            source: 'billing_reconciliation',
                            salesChannel: 'mercadolibre',
                            isEstimated: false,
                            affectsProfit: true,
                            externalReference: String(chargeInfo.detail_id || ''),
                            effectiveAt: chargeInfo.creation_date_time ? new Date(chargeInfo.creation_date_time) : new Date(),
                        });
                    });
                }
                try {
                    await db.transaction(async (tx) => {
                        await tx.delete(orderItemCosts).where(and(
                            inArray(orderItemCosts.orderItemId, itemIds),
                            eq(orderItemCosts.source, 'billing_reconciliation')
                        ));
                        if (categoriesFound.has('marketplace_fee')) {
                            await tx.delete(orderItemCosts).where(and(
                                inArray(orderItemCosts.orderItemId, itemIds),
                                eq(orderItemCosts.costCode, 'ml_sale_fee_total')
                            ));
                        }
                        if (categoriesFound.has('shipping_fee')) {
                            await tx.delete(orderItemCosts).where(and(
                                inArray(orderItemCosts.orderItemId, itemIds),
                                eq(orderItemCosts.costCode, 'ml_shipping_seller_cost')
                            ));
                        }
                        for (const category of ['payment_fee', 'tax'] as const) {
                            if (categoriesFound.has(category)) {
                                await tx.delete(orderItemCosts).where(and(
                                    inArray(orderItemCosts.orderItemId, itemIds),
                                    eq(orderItemCosts.category, category),
                                    eq(orderItemCosts.source, 'channel_estimate')
                                ));
                            }
                        }
                        if (rows.length > 0) await tx.insert(orderItemCosts).values(rows);

                        const now = new Date();
                        await tx.update(orders).set({ financialStatus: 'reconciled', updatedAt: now })
                            .where(eq(orders.id, meliOrder.internalOrderId!));
                        await tx.update(meliOrders).set({ financialStatus: 'reconciled', updatedAt: now })
                            .where(eq(meliOrders.id, meliOrder.id));
                    });
                    reconciled++;
                } catch (error) {
                    errors++;
                    console.error(`[Meli Billing] No se pudo conciliar la orden ${externalOrderId}`, error);
                }
            }

            return { reconciled, partial: 0, skipped, errors };
        } catch (error) {
            console.error('[Meli Billing] Error de conciliación', error);
            return { reconciled: 0, partial: 0, skipped: alreadySkipped, errors: pendingOrderIds.length };
        }
    }
}
