export const AdminOrderConfirmationTemplate = (data: any) => {
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
    const estimatedDelivery = formatDate(shipment.estimatedDelivery || selectedShipping.estimatedDelivery);
    const productionTimes = [...new Set(items.map((item: any) => item.productionTime).filter(Boolean))];

    // items is array of { productName, productSku, quantity, unitPrice, subtotal, customization }
    const itemsHtml = items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productSku || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${Number(item.unitPrice).toLocaleString('es-AR')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${Number(item.subtotal).toLocaleString('es-AR')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                ${item.customization ? `<strong>Personalización:</strong> ${item.customization.text || JSON.stringify(item.customization)}` : '-'}
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Venta Confirmada</title>
        <style>
            body { font-family: Arial, sans-serif; color: #1A1A1A; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8B7355; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }
            .section { margin-top: 20px; }
            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #E8C4A6; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .button { display: inline-block; background-color: #8B7355; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; text-align: center; }
            .totals { margin-top: 20px; text-align: right; }
            .totals p { margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                🛍️ Nueva orden confirmada #${order.orderNumber}
            </div>
            
            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #555;">
                Fecha: ${new Date().toLocaleString('es-AR')}
            </div>

            <div class="section">
                <div class="section-title">Datos del Cliente</div>
                <p><strong>Nombre:</strong> ${customer.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${customer.phone || 'N/A'}</p>
            </div>

            <div class="section">
                <div class="section-title">Productos Comprados</div>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Cant.</th>
                            <th>P. Unit.</th>
                            <th>Subtotal</th>
                            <th>Detalles</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <div class="totals">
                <p><strong>Subtotal:</strong> $${Number(order.subtotal).toLocaleString('es-AR')}</p>
                ${Number(order.discountAmount) > 0 ? `<p><strong>Descuento:</strong> $${Number(order.discountAmount).toLocaleString('es-AR')}</p>` : ''}
                <p><strong>Costo de Envío:</strong> $${Number(order.shippingCost).toLocaleString('es-AR')}</p>
                <p style="font-size: 18px; font-weight: bold;">Total Cobrado: $${Number(order.total).toLocaleString('es-AR')}</p>
                <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
            </div>

            <div class="section">
                <div class="section-title">Datos de Envío</div>
                <p><strong>Modalidad:</strong> ${isPickup ? 'Retiro' : 'Envío a domicilio'}</p>
                ${!isPickup ? `<p><strong>Dirección:</strong> ${addressLine || 'A confirmar'}</p>` : ''}
                ${selectedShipping.carrierName ? `<p><strong>Transporte:</strong> ${selectedShipping.carrierName}${selectedShipping.serviceTypeName ? ` — ${selectedShipping.serviceTypeName}` : ''}</p>` : ''}
                ${productionTimes.length ? `<p><strong>Preparación:</strong> ${productionTimes.join(' / ')}</p>` : ''}
                ${estimatedDelivery ? `<p><strong>Fecha máxima estimada:</strong> ${estimatedDelivery}</p>` : ''}
            </div>

            ${order.notes ? `
            <div class="section">
                <div class="section-title">Notas del Cliente</div>
                <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #E8C4A6;">${order.notes}</p>
            </div>` : ''}

            <div style="text-align: center;">
                <a href="${process.env.PUBLIC_URL}/admin/orders/${order.id}" class="button">Ver orden en el admin</a>
            </div>
        </div>
    </body>
    </html>
    `;
};
