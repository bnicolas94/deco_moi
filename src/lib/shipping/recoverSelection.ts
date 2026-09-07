import type { ShippingQuoteResult } from './zipnovaQuote.ts';

export function recoverShippingSelection(
    previousSelection: Partial<ShippingQuoteResult> | undefined,
    quotes: ShippingQuoteResult[],
    chargedPrice: number,
): ShippingQuoteResult | null {
    const desiredService = previousSelection?.serviceType
        || (previousSelection?.serviceTypeName?.toLowerCase().includes('punto') ? 'pickup_point' : 'standard_delivery');
    const recovered = quotes.find((quote) => (
        (!Number(previousSelection?.carrierId) || quote.carrierId === Number(previousSelection?.carrierId))
        && quote.serviceType === desiredService
        && (!previousSelection?.pickupPointId || quote.pickupPointId === Number(previousSelection.pickupPointId))
    ));
    if (!recovered) return null;

    return {
        ...recovered,
        quotedEstimatedDelivery: previousSelection?.quotedEstimatedDelivery
            || previousSelection?.estimatedDelivery
            || recovered.quotedEstimatedDelivery
            || recovered.estimatedDelivery,
        price: Number(previousSelection?.price ?? chargedPrice),
        priceInclTax: Number(previousSelection?.priceInclTax ?? previousSelection?.price ?? chargedPrice),
    };
}
