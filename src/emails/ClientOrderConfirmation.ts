export const ClientOrderConfirmationTemplate = (data: any) => {
    const { order, items, customer } = data;

    const shipping = order.shippingData || {};
    const selectedShipping = shipping.selectedShipping || {};
    const shipment = shipping.zipnovaShipment || {};
    const isPickup = order.shippingMethod === 'pickup';
    const formatDate = (value: unknown) => {
        if (!value) return '';
        const date = new Date(String(value));
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };
    const addressLine = [
        [shipping.street, shipping.number || shipping.street_number].filter(Boolean).join(' '),
        shipping.floor_apt || [shipping.floor, shipping.apartment].filter(Boolean).join(' '),
        shipping.city,
        shipping.state,
        shipping.postal_code || shipping.postalCode || shipping.zipcode
            ? `CP ${shipping.postal_code || shipping.postalCode || shipping.zipcode}`
            : '',
    ].filter(Boolean).join(', ');
    const estimatedDelivery = formatDate(selectedShipping.quotedEstimatedDelivery || selectedShipping.estimatedDelivery);
    const productionTimes = [...new Set(items.map((item: any) => item.productionTime).filter(Boolean))];
    const shippingDetailsHtml = isPickup ? `
        <p><strong>Modalidad:</strong> Retiro en el punto acordado</p>
        ${shipping.pickupAddress ? `<p><strong>Dirección de retiro:</strong> ${shipping.pickupAddress}</p>` : ''}
        <p style="color:#666;font-size:13px;">Te avisaremos cuando el pedido esté listo para retirar.</p>
    ` : `
        <p><strong>Modalidad:</strong> Envío a domicilio</p>
        <p><strong>Dirección:</strong> ${addressLine || 'A confirmar'}</p>
        ${selectedShipping.carrierName ? `<p><strong>Transporte:</strong> ${selectedShipping.carrierName}${selectedShipping.serviceTypeName ? ` — ${selectedShipping.serviceTypeName}` : ''}</p>` : ''}
        ${productionTimes.length ? `<p><strong>Preparación del producto:</strong> ${productionTimes.join(' / ')}</p>` : ''}
        ${estimatedDelivery ? `<p><strong>Entrega total máxima estimada:</strong> ${estimatedDelivery}</p>` : ''}
        <p style="color:#666;font-size:13px;line-height:1.5;">La fecha informada ya contempla la elaboración y el traslado estimado. Te avisaremos cuando el pedido esté listo y, al generar el despacho, recibirás el seguimiento del correo.</p>
    `;
    const whatsappNumber = process.env.PUBLIC_WHATSAPP_NUMBER || (import.meta as any).env?.PUBLIC_WHATSAPP_NUMBER;
    const contactLinks = [
        whatsappNumber ? `<a href="https://wa.me/${String(whatsappNumber).replace(/\D/g, '')}">WhatsApp</a>` : '',
        '<a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>',
    ].filter(Boolean).join(' o por ');

    const itemsHtml = items.map((item: any) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                ${item.productName}
                ${item.customization ? `<br><small style="color: #666;">Personalización: ${item.customization.text || JSON.stringify(item.customization)}</small>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.unitPrice).toLocaleString('es-AR')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.subtotal).toLocaleString('es-AR')}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Tu pedido está confirmado!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #E8C4A6; }
            .logo { width: 150px; height: auto; margin-bottom: 15px; } /* Usamos texto si no hay logo absoluto, o ajusta la URL */
            .logo-text { font-size: 28px; font-weight: bold; color: #8B7355; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
            h1 { font-size: 24px; color: #8B7355; margin-bottom: 10px; }
            .greeting { font-size: 16px; margin-bottom: 20px; }
            .order-info { background-color: #fdfbf7; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; padding: 12px; font-size: 14px; color: #8B7355; border-bottom: 2px solid #E8C4A6; }
            .totals { text-align: right; margin-top: 15px; }
            .totals p { margin: 5px 0; font-size: 15px; }
            .total-highlight { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8C4A6; }
            .section-title { font-size: 18px; color: #8B7355; margin-top: 30px; margin-bottom: 10px; font-weight: bold; }
            .shipping-info { background-color: #f5f5f5; padding: 15px; border-radius: 6px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
            .footer a { color: #8B7355; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <!-- <img src="URL_DEL_LOGO" alt="Deco Moi" class="logo"> -->
                <p class="logo-text">Deco Moi</p>
            </div>
            
            <div class="greeting">
                <h1>¡Gracias por tu compra, ${customer.name || 'amigo/a'}!</h1>
                <p>Tu pedido <strong>#${order.orderNumber}</strong> ${order.paymentMethod === 'transfer' ? 'está registrado y esperando tu pago.' : 'está confirmado y ya estamos trabajando en él. 🎉'}</p>
            </div>

            ${order.paymentMethod === 'transfer' ? `
            <div style="background-color: #fdfaf6; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #E8C4A6;">
                <h2 style="font-size: 18px; color: #8B7355; margin-top: 0;">Realizá tu transferencia por $${Number(order.total).toLocaleString('es-AR')}</h2>
                <p style="margin: 5px 0;"><strong>Titular:</strong> ${data.bankConfig?.holder || 'No configurado'}</p>
                <p style="margin: 5px 0;"><strong>CVU / Alias:</strong> ${data.bankConfig?.cvu || 'No configurado'}</p>
                <p style="margin-top: 15px; font-size: 13px; color: #666; line-height: 1.4;">⚠️ <strong>Atención:</strong> Por favor, asegurate de transferir desde la cuenta a nombre del DNI que ingresaste en la compra. Nuestro sistema detectará el ingreso automáticamente. Si preferís asegurar, envíanos el comprobante al WhatsApp.</p>
            </div>
            ` : ''}

            <div class="order-info">
                <strong>Número de orden:</strong> #${order.orderNumber}<br>
                <strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-AR')}<br>
                <strong>Método de pago:</strong> ${order.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia Bancaria'}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th style="text-align: center;">Cant.</th>
                        <th style="text-align: right;">Unit.</th>
                        <th style="text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="totals">
                <p>Subtotal: $${Number(order.subtotal).toLocaleString('es-AR')}</p>
                ${Number(order.discountAmount) > 0 ? `<p>Descuento por método de pago: -$${Number(order.discountAmount).toLocaleString('es-AR')}</p>` : ''}
                <p>Costo de Envío: $${Number(order.shippingCost).toLocaleString('es-AR')}</p>
                <div class="total-highlight">
                    ${order.paymentStatus === 'approved' ? 'Total pagado' : 'Total del pedido'}: $${Number(order.total).toLocaleString('es-AR')}
                </div>
            </div>

            <div class="section-title">Datos de Envío</div>
            <div class="shipping-info">
                ${shippingDetailsHtml}
            </div>

            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">
                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>
            </div>

            <div class="footer">
                <p>¿Tenés alguna duda? Contactanos por ${contactLinks}.</p>
                <p>&copy; ${new Date().getFullYear()} Deco Moi. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
