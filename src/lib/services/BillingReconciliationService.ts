import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { meliOrders, orderItemCosts, orderItems, orders } from '@/lib/db/schema';
import { getValidAccessToken } from '@/lib/integrations/mercadolibre/auth';

type BillingCategory = 'marketplace_fee' | 'payment_fee' | 'tax' | 'shipping_fee' | 'advertising' | 'operational';

function classifyBillingDetail(description: string, subtype: string): BillingCategory {
    const value = `${description} ${subtype}`.toLowerCase();
    if (value.includes('ingresos brutos') || value.includes('iibb') || value.includes('percep') || value.includes('impuesto')) return 'tax';
    if (value.includes('mercado pago') || value.includes('mercadopago') || value.includes('procesamiento de pago')) return 'payment_fee';
    if (value.includes('envío') || value.includes('envio') || value.includes('shipping') || subtype.toUpperCase().includes('XD')) return 'shipping_fee';
    if (value.includes('publicidad') || value.includes('product ads')) return 'advertising';
    if (value.includes('vender') || value.includes('venta') || subtype.toUpperCase().startsWith('CV')) return 'marketplace_fee';
    return 'operational';
}

export class BillingReconciliationService {
    static async reconcilePendingOrders(limit = 60): Promise<{ reconciled: number; skipped: number; errors: number }> {
        const pending = await db.select().from(meliOrders).where(and(
            eq(meliOrders.status, 'paid'),
            isNotNull(meliOrders.internalOrderId)
        )).limit(Math.min(Math.max(limit, 1), 60));
        return this.reconcileOrders(pending.map(order => order.meliOrderId));
    }

    static async reconcileOrders(orderIds: string[]): Promise<{ reconciled: number; skipped: number; errors: number }> {
        const uniqueOrderIds = [...new Set(orderIds)].slice(0, 60);
        if (uniqueOrderIds.length === 0) return { reconciled: 0, skipped: 0, errors: 0 };

        try {
            const token = await getValidAccessToken();
            const params = new URLSearchParams({ order_ids: uniqueOrderIds.join(','), sort_by: 'ID', order_by: 'ASC' });
            const response = await fetch(`https://api.mercadolibre.com/billing/integration/group/ML/order/details?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok && response.status !== 206) {
                throw new Error(`Billing ML respondió ${response.status}: ${await response.text()}`);
            }

            const payload = await response.json();
            const details: any[] = payload.results || [];
            let reconciled = 0;
            let skipped = 0;

            for (const externalOrderId of uniqueOrderIds) {
                const [meliOrder] = await db.select().from(meliOrders).where(eq(meliOrders.meliOrderId, externalOrderId)).limit(1);
                if (!meliOrder?.internalOrderId) {
                    skipped++;
                    continue;
                }
                const saleDetails = details.filter(detail => detail.sales_info?.some((sale: any) => String(sale.order_id) === externalOrderId));
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
                    categoriesFound.add(classifyBillingDetail(
                        detail.charge_info?.transaction_detail || '',
                        detail.charge_info?.detail_sub_type || ''
                    ));
                }

                await db.delete(orderItemCosts).where(and(
                    inArray(orderItemCosts.orderItemId, itemIds),
                    eq(orderItemCosts.source, 'billing_reconciliation')
                ));
                if (categoriesFound.has('marketplace_fee')) {
                    await db.delete(orderItemCosts).where(and(
                        inArray(orderItemCosts.orderItemId, itemIds),
                        eq(orderItemCosts.costCode, 'ml_sale_fee_total')
                    ));
                }
                if (categoriesFound.has('shipping_fee')) {
                    await db.delete(orderItemCosts).where(and(
                        inArray(orderItemCosts.orderItemId, itemIds),
                        eq(orderItemCosts.costCode, 'ml_shipping_seller_cost')
                    ));
                }
                for (const category of ['payment_fee', 'tax'] as const) {
                    if (categoriesFound.has(category)) {
                        await db.delete(orderItemCosts).where(and(
                            inArray(orderItemCosts.orderItemId, itemIds),
                            eq(orderItemCosts.category, category),
                            eq(orderItemCosts.source, 'channel_estimate')
                        ));
                    }
                }

                const totalRevenue = internalItems.reduce((sum, item) => sum + Number(item.netRevenue || item.subtotal), 0);
                const rows: typeof orderItemCosts.$inferInsert[] = [];
                for (const detail of saleDetails) {
                    const chargeInfo = detail.charge_info || {};
                    const category = classifyBillingDetail(chargeInfo.transaction_detail || '', chargeInfo.detail_sub_type || '');
                    const rawAmount = Math.abs(Number(chargeInfo.detail_amount || 0));
                    const signedAmount = String(chargeInfo.detail_type || '').toUpperCase() === 'BONUS' ? -rawAmount : rawAmount;
                    const relatedItemId = detail.sales_info?.find((sale: any) => String(sale.order_id) === externalOrderId)?.item_id;
                    const targetItems = relatedItemId
                        ? internalItems.filter(item => item.externalItemId === String(relatedItemId))
                        : internalItems;
                    const allocatableItems = targetItems.length > 0 ? targetItems : internalItems;
                    const allocationBase = allocatableItems.reduce((sum, item) => sum + Number(item.netRevenue || item.subtotal), 0) || totalRevenue;
                    let allocated = 0;

                    allocatableItems.forEach((item, index) => {
                        const itemRevenue = Number(item.netRevenue || item.subtotal);
                        const amount = index === allocatableItems.length - 1
                            ? signedAmount - allocated
                            : Math.round((signedAmount * itemRevenue / allocationBase) * 100) / 100;
                        allocated += amount;
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
                if (rows.length > 0) await db.insert(orderItemCosts).values(rows);

                const financialStatus = response.status === 206 ? 'partially_reconciled' : 'reconciled';
                await db.update(orders).set({ financialStatus, updatedAt: new Date() }).where(eq(orders.id, meliOrder.internalOrderId));
                await db.update(meliOrders).set({ financialStatus, updatedAt: new Date() }).where(eq(meliOrders.id, meliOrder.id));
                reconciled++;
            }

            return { reconciled, skipped, errors: 0 };
        } catch (error) {
            console.error('[Meli Billing] Error de conciliación', error);
            return { reconciled: 0, skipped: 0, errors: uniqueOrderIds.length };
        }
    }
}
