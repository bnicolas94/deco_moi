import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { orders, shippingRealCosts } from '@/lib/db/schema';
import { and, gte, lte, inArray, eq } from 'drizzle-orm';
import { OrderStatus, PaymentStatus } from '@/types/order';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');

        // Considerar solo órdenes cuyo pago haya sido aprobado, independientemente de la etapa de preparación
        let conditions: any[] = [
            eq(orders.paymentStatus, PaymentStatus.APPROVED)
        ];

        if (start) conditions.push(gte(orders.createdAt, new Date(start)));
        if (end) {
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);
            conditions.push(lte(orders.createdAt, endDate));
        }

        const periodOrders = await db.query.orders.findMany({
            where: and(...conditions),
            with: {
                items: {
                    with: {
                        costs: true
                    }
                }
            }
        });

        const allShippingZones = await db.select().from(shippingRealCosts);

        let ingresosBrutos = 0;
        let totalCostos = 0;
        let totalEnviosCobrados = 0;
        let totalEnviosCostosReales = 0;

        const breakdownCosts = new Map();
        const breakdownShipping = new Map();
        const breakdownProducts = new Map();

        for (const order of periodOrders) {
            ingresosBrutos += Number(order.total);
            const cobradoEnvio = Number(order.shippingCost || 0);
            totalEnviosCobrados += cobradoEnvio;

            // Determinar zona de envío
            let customerState = 'Desconocido';
            let matchedZone = null;

            if (order.shippingMethod === 'pickup') {
                customerState = 'Retiro Local';
                matchedZone = allShippingZones.find(z => z.zone.toLowerCase().includes('retiro') || z.zone.toLowerCase().includes('local') || z.zone.toLowerCase() === 'caba');
            } else if (order.shippingData?.address?.state) {
                customerState = order.shippingData.address.state.toLowerCase().trim();
                matchedZone = allShippingZones.find(z => customerState.includes(z.zone.toLowerCase().trim())) ||
                    allShippingZones.find(z => z.zone.toLowerCase() === 'resto del país');
            }

            const costoRealEnvio = matchedZone ? Number(matchedZone.realCost) : (order.shippingMethod === 'pickup' ? 0 : 0);
            const zoneName = matchedZone ? matchedZone.zone : (order.shippingMethod === 'pickup' ? 'Retiro Local' : customerState);

            totalEnviosCostosReales += costoRealEnvio;

            if (!breakdownShipping.has(zoneName)) {
                breakdownShipping.set(zoneName, { ord: 0, cobrado: 0, costoReal: 0 });
            }
            const sSum = breakdownShipping.get(zoneName);
            sSum.ord += 1;
            sSum.cobrado += cobradoEnvio;
            sSum.costoReal += costoRealEnvio;

            // Procesar items y costos
            for (const item of order.items) {
                const prodKey = item.productId;
                if (!breakdownProducts.has(prodKey)) {
                    breakdownProducts.set(prodKey, { name: item.productName, units: 0, ingresos: 0, costos: 0 });
                }
                const pSum = breakdownProducts.get(prodKey);
                pSum.units += item.quantity;
                pSum.ingresos += Number(item.subtotal);

                let itemCostSum = 0;
                for (const cost of item.costs) {
                    const calcAmount = Number(cost.calculatedAmount);
                    itemCostSum += calcAmount;
                    totalCostos += calcAmount;

                    if (!breakdownCosts.has(cost.costItemName)) {
                        breakdownCosts.set(cost.costItemName, { type: cost.costItemType, totalAmount: 0, value: cost.configuredValue });
                    }
                    const cSum = breakdownCosts.get(cost.costItemName);
                    cSum.totalAmount += calcAmount;
                }
                pSum.costos += itemCostSum;
            }
        }

        const resEnvios = totalEnviosCobrados - totalEnviosCostosReales;
        const ingresosNetos = ingresosBrutos - totalCostos + resEnvios;
        const margenPorcentaje = ingresosBrutos > 0 ? (ingresosNetos / ingresosBrutos) * 100 : 0;

        return new Response(JSON.stringify({
            summary: {
                ingresosBrutos,
                costosConfigurables: totalCostos,
                resultadoEnvios: resEnvios,
                ingresosNetos,
                margenPorcentaje
            },
            breakdownCosts: Array.from(breakdownCosts.entries()).map(([k, v]) => ({ name: k, ...v })),
            breakdownShipping: Array.from(breakdownShipping.entries()).map(([k, v]) => ({ zone: k, ...v })),
            breakdownProducts: Array.from(breakdownProducts.entries()).map(([k, v]) => ({ id: k, ...v }))
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
