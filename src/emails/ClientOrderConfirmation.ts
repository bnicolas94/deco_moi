export const ClientOrderConfirmationTemplate = (data: any) => {
    const { order, items, customer } = data;

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
                <p>Tu pedido <strong>#${order.orderNumber}</strong> está confirmado y ya estamos trabajando en él. 🎉</p>
            </div>

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
                    Total Pagado: $${Number(order.total).toLocaleString('es-AR')}
                </div>
            </div>

            <div class="section-title">Datos de Envío</div>
            <div class="shipping-info">
                <p><strong>Dirección:</strong> ${order.shippingData?.street} ${order.shippingData?.number || ''} ${order.shippingData?.floor ? `Piso ${order.shippingData.floor}` : ''} ${order.shippingData?.apartment ? `Depto ${order.shippingData.apartment}` : ''}, ${order.shippingData?.city}, ${order.shippingData?.state}, ${order.shippingData?.postalCode}</p>
                <p><strong>Zona y tiempo estimado:</strong> ${order.shippingData?.selectedShipping?.estimatedDays || 'No especificado'} (${order.shippingMethod})</p>
                <!-- <p><em>* Recuerda que el tiempo total suma los días de producción más el tiempo de envío.</em></p> -->
            </div>

            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">
                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>
            </div>

            <div class="footer">
                <p>¿Tenés alguna duda? Contactanos por <a href="https://wa.me/${process.env.PUBLIC_WHATSAPP_NUMBER}">WhatsApp</a> o en <a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>.</p>
                <p>&copy; ${new Date().getFullYear()} Deco Moi. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
