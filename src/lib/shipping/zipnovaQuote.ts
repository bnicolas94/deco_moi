export interface ShippingQuoteResult {
    id: string;
    serviceType: string;
    serviceTypeName: string;
    logisticType: string;
    logisticTypeName: string;
    carrierName: string;
    carrierId: number;
    price: number;
    priceInclTax: number;
    carrierCost?: number;
    estimatedDelivery: string;
    quotedEstimatedDelivery?: string;
    estimationExpiresAt?: string;
    deliveryTimeHours: number | null;
    preparationTime?: string;
    shippingTime?: string;
    totalTime?: string;
    pickupPointId?: number;
    pickupPointName?: string;
    pickupPointAddress?: string;
}

function apiValueCode(value: any): string {
    if (typeof value === 'string') return value;
    return value?.code || value?.id?.toString() || '';
}

function apiValueName(value: any, fallback: string): string {
    if (typeof value === 'object' && value) return value.name || value.description || fallback;
    const names: Record<string, string> = {
        standard_delivery: 'Entrega a domicilio',
        pickup_point: 'Entrega en punto de entrega',
        carrier_dropoff: 'Despacho en sucursal',
        carrier_pickup: 'Retiro por el correo',
        crossdock: 'Despacho en centro logístico',
    };
    return names[String(value || '')] || fallback;
}

export function normalizeZipnovaQuoteResult(result: any, index = 0): ShippingQuoteResult[] {
    const serviceType = result?.service_type;
    const logisticType = result?.logistic_type;
    const carrier = result?.carrier || {};
    const amounts = result?.amounts || result?.price || {};
    const deliveryTime = result?.delivery_time || {};
    const pickupPoints = Array.isArray(result?.pickup_points) ? result.pickup_points : [];
    const baseResult = {
        serviceType: apiValueCode(serviceType),
        serviceTypeName: apiValueName(serviceType, 'Envío estándar'),
        logisticType: apiValueCode(logisticType),
        logisticTypeName: apiValueName(logisticType, ''),
        carrierName: typeof carrier === 'string' ? carrier : carrier.name || 'Correo',
        carrierId: Number(typeof carrier === 'object' ? carrier.id : result?.carrier_id) || 0,
        price: Number(amounts.price_incl_tax ?? amounts.price ?? amounts.total) || 0,
        priceInclTax: Number(amounts.price_incl_tax ?? amounts.price ?? amounts.total) || 0,
        estimatedDelivery: deliveryTime.estimated_delivery || '',
        quotedEstimatedDelivery: deliveryTime.estimated_delivery || '',
        estimationExpiresAt: deliveryTime.estimation_expires_at || '',
        deliveryTimeHours: null,
        preparationTime: deliveryTime.times?.preparation || '',
        shippingTime: deliveryTime.times?.shipping || deliveryTime.times?.carrier || '',
        totalTime: deliveryTime.times?.total || '',
    };

    if (baseResult.serviceType === 'pickup_point' && pickupPoints.length > 0) {
        return pickupPoints.map((point: any) => ({
            ...baseResult,
            id: `zipnova_${baseResult.carrierId || index}_${baseResult.serviceType}_${baseResult.logisticType}_${point.point_id || point.id}`,
            pickupPointId: Number(point.point_id || point.id),
            pickupPointName: point.name || point.description || 'Punto de entrega',
            pickupPointAddress: point.address || point.full_address || '',
        }));
    }

    return [{
        ...baseResult,
        id: `zipnova_${baseResult.carrierId || index}_${baseResult.serviceType || 'std'}_${baseResult.logisticType || 'std'}`,
    }];
}
