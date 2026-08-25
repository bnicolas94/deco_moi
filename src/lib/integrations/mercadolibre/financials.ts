export interface MeliOrderItemFinancialInput {
    quantity?: number | string | null;
    sale_fee?: number | string | null;
}

export interface MeliOrderFinancialInput {
    marketplace_fee?: number | string | null;
    order_items?: MeliOrderItemFinancialInput[] | null;
}

function asNonNegativeNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Mercado Libre reports order_items[].sale_fee as a fee per sold unit. */
export function getLineSaleFeeTotal(item: MeliOrderItemFinancialInput): number {
    const feePerUnit = asNonNegativeNumber(item.sale_fee) || 0;
    const quantity = asNonNegativeNumber(item.quantity) || 0;
    return roundMoney(feePerUnit * quantity);
}

/** Prefer the order-level marketplace_fee and use the per-unit fees as fallback. */
export function getOrderMarketplaceFee(order: MeliOrderFinancialInput): number {
    const marketplaceFee = asNonNegativeNumber(order.marketplace_fee);
    if (marketplaceFee !== null) return roundMoney(marketplaceFee);

    return roundMoney((order.order_items || []).reduce(
        (sum, item) => sum + getLineSaleFeeTotal(item),
        0
    ));
}

export function getSellerShippingCost(shipment: unknown): number | null {
    const cost = asNonNegativeNumber((shipment as any)?.seller?.cost);
    return cost === null ? null : roundMoney(cost);
}

export function getEstimatedShippingCost(orderTotal: number, config: {
    freeShippingThreshold?: number | string | null;
    freeShippingCost?: number | string | null;
}): number {
    const threshold = asNonNegativeNumber(config.freeShippingThreshold) || 0;
    const cost = asNonNegativeNumber(config.freeShippingCost) || 0;
    return threshold > 0 && orderTotal >= threshold ? roundMoney(cost) : 0;
}

/** Allocates an order-level amount in cents and preserves the exact total. */
export function allocateMoney(total: number, weights: number[]): number[] {
    if (weights.length === 0) return [];

    const roundedTotal = roundMoney(total);
    const sanitizedWeights = weights.map(weight => Number.isFinite(weight) && weight > 0 ? weight : 0);
    const weightTotal = sanitizedWeights.reduce((sum, weight) => sum + weight, 0);
    const effectiveWeights = weightTotal > 0 ? sanitizedWeights : sanitizedWeights.map(() => 1);
    const effectiveTotal = effectiveWeights.reduce((sum, weight) => sum + weight, 0);
    let allocated = 0;

    return effectiveWeights.map((weight, index) => {
        const amount = index === effectiveWeights.length - 1
            ? roundMoney(roundedTotal - allocated)
            : roundMoney(roundedTotal * weight / effectiveTotal);
        allocated = roundMoney(allocated + amount);
        return amount;
    });
}
