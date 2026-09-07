import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { orders } from '@/lib/db/schema';
import { createShipment, getShipment, quoteShipment } from '@/lib/services/ShippingService';
import type { ShippingQuoteResult } from '@/lib/services/ShippingService';
import { recoverShippingSelection } from '@/lib/shipping/recoverSelection';
import { normalizeZipnovaShipment } from '@/lib/shipping/zipnovaShipment';

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

async function loadOrder(id: string) {
    return db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
            items: {
                with: { product: true },
            },
        },
    });
}

export const GET: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') return json({ error: 'No autorizado' }, 401);
    const order = await loadOrder(context.params.id || '');
    if (!order) return json({ error: 'Orden no encontrada' }, 404);
    if (!order.zipnovaShipmentId) return json({ error: 'La orden todavía no tiene un despacho creado' }, 409);

    try {
        const shipment = normalizeZipnovaShipment(await getShipment(order.zipnovaShipmentId));
        const previousShipment = (order.shippingData as any)?.zipnovaShipment || {};
        const shippingData = { ...(order.shippingData || {}), zipnovaShipment: { ...previousShipment, ...shipment } };
        await db.update(orders).set({ shippingData, updatedAt: new Date() }).where(eq(orders.id, order.id));
        return json({ shipment });
    } catch (error) {
        console.error('[Admin shipment] Error al actualizar:', error);
        return json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el despacho' }, 502);
    }
};

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') return json({ error: 'No autorizado' }, 401);
    const order = await loadOrder(context.params.id || '');
    if (!order) return json({ error: 'Orden no encontrada' }, 404);

    if (order.zipnovaShipmentId) {
        try {
            return json({ created: false, shipment: normalizeZipnovaShipment(await getShipment(order.zipnovaShipmentId)) });
        } catch {
            return json({ created: false, shipment: (order.shippingData as any)?.zipnovaShipment || { id: order.zipnovaShipmentId } });
        }
    }
    if (order.salesChannel !== 'app') return json({ error: 'Los envíos de Mercado Libre se gestionan con la etiqueta de Mercado Envíos.' }, 409);
    if (order.shippingMethod !== 'delivery') return json({ error: 'Esta orden es para retiro y no necesita etiqueta.' }, 409);
    if (order.paymentStatus !== 'approved') return json({ error: 'Confirmá el pago antes de generar el despacho.' }, 409);
    if (order.status === 'cancelled') return json({ error: 'No se puede despachar una orden cancelada.' }, 409);

    const shipping = (order.shippingData || {}) as Record<string, any>;
    let selected = shipping.selectedShipping as ShippingQuoteResult | undefined;

    let requestBody: Record<string, any> = {};
    try {
        requestBody = await context.request.json();
    } catch {
        requestBody = {};
    }

    const document = String(
        requestBody.document || shipping.document || shipping.dni || shipping.cuit || shipping.transfer_dni || '',
    ).replace(/\D/g, '');
    if (document.length < 7 || document.length > 11) {
        return json({ error: 'Ingresá el DNI/CUIT del destinatario para generar la etiqueta.' }, 400);
    }

    const destination = {
        name: String(shipping.full_name || shipping.name || '').trim(),
        street: String(shipping.street || '').trim(),
        streetNumber: String(shipping.number || shipping.street_number || '').trim(),
        streetExtras: String(shipping.floor_apt || shipping.street_extras || '').trim(),
        city: String(shipping.city || '').trim(),
        state: String(shipping.state || '').trim(),
        zipcode: String(shipping.postal_code || shipping.zipcode || '').trim(),
        document,
        email: String(shipping.email || '').trim(),
        phone: String(shipping.phone || '').trim(),
        country: 'AR',
        pointId: selected?.pickupPointId ? Number(selected.pickupPointId) : undefined,
    };
    const missing = Object.entries({
        nombre: destination.name,
        calle: destination.street,
        número: destination.streetNumber,
        localidad: destination.city,
        provincia: destination.state,
        'código postal': destination.zipcode,
        email: destination.email,
        teléfono: destination.phone,
    }).filter(([, value]) => !value).map(([label]) => label);
    if (selected?.serviceType === 'pickup_point') {
        const addressOnly = new Set(['calle', 'número', 'localidad', 'provincia', 'código postal']);
        for (let index = missing.length - 1; index >= 0; index--) {
            if (addressOnly.has(missing[index])) missing.splice(index, 1);
        }
        if (!destination.pointId) missing.push('punto de entrega');
    }
    if (missing.length > 0) return json({ error: `Faltan datos de envío: ${missing.join(', ')}.` }, 400);

    const shipmentItems = order.items.map((item) => ({
        sku: item.productSku || `PRODUCT-${item.productId}`,
        description: item.productName,
        weight: item.product?.weight || 0,
        height: item.product?.height || 0,
        width: item.product?.width || 0,
        length: item.product?.length || 0,
        quantity: item.quantity,
    }));
    const declaredValue = Math.max(0, Number(order.subtotal) - Number(order.discountAmount || 0));

    try {
        if (!selected?.serviceType || !selected?.logisticType || !Number(selected?.carrierId)) {
            if (selected?.id === 'flat_rate' || selected?.serviceType === 'flat_rate') {
                return json({ error: 'Esta orden usa una tarifa fija y debe despacharse manualmente.' }, 409);
            }

            const previousSelection = selected;
            const quotes = await quoteShipment(shipmentItems, {
                city: destination.city,
                state: destination.state,
                zipcode: destination.zipcode,
                country: destination.country,
            }, declaredValue, { includeAllResults: true });
            const recovered = recoverShippingSelection(previousSelection, quotes, Number(order.shippingCost));

            if (!recovered) {
                return json({ error: 'No pudimos reconstruir la opción elegida. Volvé a cotizar o gestioná el envío manualmente.' }, 409);
            }

            selected = recovered;
            destination.pointId = selected.pickupPointId;
        }

        const createdPayload = await createShipment({
            items: shipmentItems,
            destination,
            declaredValue,
            externalId: order.orderNumber.slice(0, 30),
            serviceType: selected.serviceType,
            logisticType: selected.logisticType,
            carrierId: Number(selected.carrierId),
        });
        const shipment = normalizeZipnovaShipment(createdPayload);
        if (!shipment.id) throw new Error('Zipnova creó el envío pero no devolvió su identificador');

        const shippingData = {
            ...shipping,
            document,
            selectedShipping: selected,
            zipnovaShipment: shipment,
        };
        await db.update(orders).set({
            zipnovaShipmentId: shipment.id,
            shippingData,
            status: ['pending', 'confirmed'].includes(order.status) ? 'processing' : order.status,
            updatedAt: new Date(),
        }).where(eq(orders.id, order.id));

        return json({ created: true, shipment }, 201);
    } catch (error) {
        console.error('[Admin shipment] Error al crear:', error);
        return json({ error: error instanceof Error ? error.message : 'No se pudo crear el despacho' }, 502);
    }
};
