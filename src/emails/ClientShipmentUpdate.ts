function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export const ClientShipmentUpdateTemplate = (data: any) => {
    const { order, customer } = data;
    const shipping = order.shippingData || {};
    const selected = shipping.selectedShipping || {};
    const shipment = shipping.zipnovaShipment || {};
    const trackingUrl = /^https:\/\//i.test(String(data.trackingUrl || '')) ? String(data.trackingUrl) : '';
    const estimatedDelivery = formatDate(shipment.estimatedDelivery || selected.estimatedDelivery);
    const address = [
        [shipping.street, shipping.number || shipping.street_number].filter(Boolean).join(' '),
        shipping.floor_apt,
        shipping.city,
        shipping.state,
        shipping.postal_code || shipping.postalCode || shipping.zipcode
            ? `CP ${shipping.postal_code || shipping.postalCode || shipping.zipcode}`
            : '',
    ].filter(Boolean).map(escapeHtml).join(', ');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Tu pedido está listo para despachar</title></head>
    <body style="margin:0;background:#f7f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#222;line-height:1.55;">
        <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;padding:32px;">
            <p style="margin:0;text-align:center;font-size:27px;font-weight:700;color:#8B7355;letter-spacing:1px;">Deco Moi</p>
            <h1 style="font-size:23px;margin:28px 0 8px;color:#8B7355;">Tu pedido está listo para despachar</h1>
            <p>Hola <strong>${escapeHtml(customer.name || 'Cliente')}</strong>, preparamos el envío de tu orden <strong>#${escapeHtml(order.orderNumber)}</strong>.</p>

            <div style="background:#f7f6f3;border-radius:10px;padding:18px;margin:22px 0;">
                <p style="margin:0 0 8px;"><strong>Transporte:</strong> ${escapeHtml(shipment.carrierName || selected.carrierName || 'Correo')}</p>
                ${selected.serviceTypeName ? `<p style="margin:8px 0;"><strong>Servicio:</strong> ${escapeHtml(selected.serviceTypeName)}</p>` : ''}
                ${shipment.carrierTrackingId ? `<p style="margin:8px 0;"><strong>Número de seguimiento:</strong> ${escapeHtml(shipment.carrierTrackingId)}</p>` : ''}
                <p style="margin:8px 0;"><strong>Entrega:</strong> ${address || 'Domicilio informado en la compra'}</p>
                ${estimatedDelivery ? `<p style="margin:8px 0 0;"><strong>Fecha máxima estimada por el correo:</strong> ${estimatedDelivery}</p>` : ''}
            </div>

            ${trackingUrl ? `<p style="text-align:center;margin:28px 0;"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#222;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;">Seguir mi envío</a></p>` : ''}
            <p style="font-size:13px;color:#666;">El correo puede actualizar la fecha a medida que avanza el despacho. El enlace de seguimiento siempre muestra la información logística más reciente.</p>
            <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:18px;margin-top:28px;text-align:center;">Deco Moi — Souvenirs &amp; regalos</p>
        </div>
    </body>
    </html>`;
};
