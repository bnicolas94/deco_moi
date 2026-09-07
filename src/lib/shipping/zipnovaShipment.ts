export interface NormalizedZipnovaShipment {
    id: string;
    status: string;
    statusName: string;
    tracking: string | null;
    trackingExternal: string | null;
    carrierTrackingId: string | null;
    carrierName: string | null;
    estimatedDelivery: string | null;
    dropoffDeadlineAt: string | null;
    preparationTime: string | null;
    carrierTime: string | null;
    totalTime: string | null;
    createdAt: string;
    labelReady: boolean;
}

const LABEL_READY_STATUSES = new Set([
    'documentation_ready',
    'ready_to_ship',
    'shipped',
    'in_transit_to_crossdock',
    'admitted',
    'xd_pending',
    'crossdock',
    'in_transit_to_carrier',
    'received_by_carrier',
    'in_transit',
    'delivery_attempt',
    'out_for_delivery',
    'available_for_pickup',
    'delivered',
    'delivered_with_damage',
    'not_delivered',
]);

export function isZipnovaLabelReady(status: unknown): boolean {
    return LABEL_READY_STATUSES.has(String(status || '').toLowerCase());
}

export function normalizeZipnovaShipment(payload: any): NormalizedZipnovaShipment {
    const shipment = payload?.data || payload?.shipment || payload || {};
    const status = String(shipment.status || '');
    const deliveryTime = shipment.delivery_time || {};

    return {
        id: shipment.id !== undefined && shipment.id !== null ? String(shipment.id) : '',
        status,
        statusName: shipment.status_name || shipment.statusName || status || 'Creado',
        tracking: shipment.tracking || shipment.tracking_url || null,
        trackingExternal: shipment.tracking_external || null,
        carrierTrackingId: shipment.carrier_tracking_id || shipment.delivery_id || null,
        carrierName: shipment.carrier?.name || null,
        estimatedDelivery: deliveryTime.estimated_delivery || null,
        dropoffDeadlineAt: deliveryTime.dropoff_deadline_at || null,
        preparationTime: deliveryTime.times?.preparation || null,
        carrierTime: deliveryTime.times?.carrier || deliveryTime.times?.shipping || null,
        totalTime: deliveryTime.times?.total || null,
        createdAt: shipment.created_at || new Date().toISOString(),
        labelReady: isZipnovaLabelReady(status),
    };
}

export function getZipnovaLabelState(shipment: Partial<NormalizedZipnovaShipment> | null | undefined, now = new Date()) {
    const status = String(shipment?.status || '').toLowerCase();
    const ready = shipment?.labelReady === true || isZipnovaLabelReady(status);
    const createdAt = shipment?.createdAt ? new Date(shipment.createdAt) : null;
    const processingForMs = createdAt && !Number.isNaN(createdAt.getTime()) ? now.getTime() - createdAt.getTime() : 0;
    const stalled = status === 'new' && processingForMs >= 2 * 60 * 1000;

    if (ready) return { ready: true, stalled: false, code: null, message: null };
    if (stalled) {
        return {
            ready: false,
            stalled: true,
            code: 'account_action_required',
            message: 'La etiqueta sigue pendiente. Revisá el saldo y el estado de la cuenta en Zipnova; después presioná Actualizar.',
        };
    }
    if (status === 'new') {
        return {
            ready: false,
            stalled: false,
            code: 'processing',
            message: 'Zipnova está preparando la documentación. Actualizá el estado en unos instantes.',
        };
    }
    return {
        ready: false,
        stalled: false,
        code: 'label_not_available',
        message: 'La etiqueta todavía no está disponible en Zipnova.',
    };
}

export function formatIsoDuration(value: unknown): string {
    const match = String(value || '').match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i);
    if (!match) return '';
    const parts: string[] = [];
    const days = Number(match[1] || 0);
    const hours = Number(match[2] || 0);
    const minutes = Number(match[3] || 0);
    if (days) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    if (hours) parts.push(`${hours} h`);
    if (minutes) parts.push(`${minutes} min`);
    return parts.join(' ') || 'Sin demora adicional';
}
