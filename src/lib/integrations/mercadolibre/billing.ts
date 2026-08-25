export type BillingCategory =
    | 'marketplace_fee'
    | 'payment_fee'
    | 'tax'
    | 'shipping_fee'
    | 'advertising'
    | 'operational';

export interface MeliBillingDetail {
    charge_info?: {
        creation_date_time?: string | null;
        detail_amount?: number | string | null;
        detail_id?: number | string | null;
        detail_sub_type?: string | null;
        detail_type?: string | null;
        transaction_detail?: string | null;
    } | null;
    sales_info?: Array<{ order_id?: number | string | null }> | null;
    items_info?: Array<{
        item_id?: number | string | null;
        order_id?: number | string | null;
    }> | null;
}

function asArray(value: unknown): any[] {
    return Array.isArray(value) ? value : [];
}

function addDetail(
    grouped: Map<string, MeliBillingDetail[]>,
    seen: Map<string, Set<string>>,
    orderId: string,
    detail: MeliBillingDetail
) {
    if (!orderId) return;
    const charge = detail.charge_info || {};
    const detailId = charge.detail_id;
    const orderSeen = seen.get(orderId) || new Set<string>();
    if (detailId !== null && detailId !== undefined) {
        const key = String(detailId);
        if (orderSeen.has(key)) return;
        orderSeen.add(key);
        seen.set(orderId, orderSeen);
    }
    grouped.set(orderId, [...(grouped.get(orderId) || []), detail]);
}

/** Normalizes the official results[].order_id -> results[].details[] response. */
export function groupBillingDetailsByOrder(payload: unknown): Map<string, MeliBillingDetail[]> {
    const grouped = new Map<string, MeliBillingDetail[]>();
    const seen = new Map<string, Set<string>>();
    const results = asArray((payload as any)?.results);

    for (const result of results) {
        const details = asArray(result?.details);
        if (result?.order_id !== null && result?.order_id !== undefined && details.length > 0) {
            const orderId = String(result.order_id);
            for (const detail of details) addDetail(grouped, seen, orderId, detail);
            continue;
        }

        // Defensive compatibility for an ungrouped detail response.
        const orderIds = new Set<string>();
        for (const sale of asArray(result?.sales_info)) {
            if (sale?.order_id !== null && sale?.order_id !== undefined) orderIds.add(String(sale.order_id));
        }
        for (const item of asArray(result?.items_info)) {
            if (item?.order_id !== null && item?.order_id !== undefined) orderIds.add(String(item.order_id));
        }
        for (const orderId of orderIds) addDetail(grouped, seen, orderId, result);
    }

    return grouped;
}

export function classifyBillingDetail(description: string, subtype: string): BillingCategory {
    const normalizedSubtype = subtype.toUpperCase();
    const value = `${description} ${subtype}`.toLowerCase();
    if (value.includes('ingresos brutos') || value.includes('iibb') || value.includes('percep') || value.includes('retenc') || value.includes('impuesto')) return 'tax';
    if (value.includes('mercado pago') || value.includes('mercadopago') || value.includes('procesamiento de pago') || value.includes('financiación') || value.includes('financiacion')) return 'payment_fee';
    if (value.includes('envío') || value.includes('envio') || value.includes('shipping') || normalizedSubtype.includes('XD')) return 'shipping_fee';
    if (value.includes('publicidad') || value.includes('product ads')) return 'advertising';
    if (value.includes('vender') || value.includes('venta') || normalizedSubtype.startsWith('CV') || normalizedSubtype.startsWith('BV')) return 'marketplace_fee';
    return 'operational';
}

export function getBillingDetailAmount(detail: MeliBillingDetail): number {
    const charge = detail.charge_info || {};
    const amount = Math.abs(Number(charge.detail_amount || 0));
    if (!Number.isFinite(amount)) return 0;
    return String(charge.detail_type || '').toUpperCase() === 'BONUS' ? -amount : amount;
}

export function getBillingDetailItemIds(detail: MeliBillingDetail, orderId: string): string[] {
    const items = asArray(detail.items_info);
    const matchingItems = items.filter(item =>
        item?.order_id === null
        || item?.order_id === undefined
        || String(item.order_id) === orderId
    );
    return [...new Set(matchingItems
        .map(item => item?.item_id)
        .filter(itemId => itemId !== null && itemId !== undefined)
        .map(String))];
}
