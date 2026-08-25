import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { meliOrders, orders, shippingRealCosts } from '@/lib/db/schema';
import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { PaymentStatus } from '@/types/order';

type CostSummary = {
    name: string;
    type: string;
    value: string | number;
    category: string;
    nature: string;
    source: string;
    isEstimated: boolean;
    totalAmount: number;
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');
        const requestedChannel = url.searchParams.get('channel') || 'all';
        const channel = requestedChannel === 'ml' ? 'mercadolibre' : requestedChannel;
        const conditions: any[] = [eq(orders.paymentStatus, PaymentStatus.APPROVED), ne(orders.status, 'cancelled')];
        if (channel !== 'all') conditions.push(eq(orders.salesChannel, channel));
        if (start) conditions.push(gte(orders.createdAt, new Date(`${start}T00:00:00`)));
        if (end) conditions.push(lte(orders.createdAt, new Date(`${end}T23:59:59.999`)));

        const periodOrders = await db.query.orders.findMany({
            where: and(...conditions),
            with: { items: { with: { costs: true } } },
        });
        const allShippingZones = await db.select().from(shippingRealCosts);

        let ingresosBrutos = 0;
        let ingresosProductos = 0;
        let totalCostos = 0;
        let totalCostosFijos = 0;
        let totalCostosVariables = 0;
        let totalMarketplaceFees = 0;
        let totalPaymentFees = 0;
        let totalTaxes = 0;
        let totalEstimatedCosts = 0;
        let totalEnviosCobrados = 0;
        let totalEnviosCostosReales = 0;

        const breakdownCosts = new Map<string, CostSummary>();
        const breakdownShipping = new Map<string, { ord: number; cobrado: number; costoReal: number }>();
        const breakdownProducts = new Map<string, any>();
        const breakdownChannels = new Map<string, { orders: number; ingresos: number; costos: number; neto: number }>();
        const breakdownSales: any[] = [];

        for (const order of periodOrders) {
            const orderRevenue = Number(order.total);
            ingresosBrutos += orderRevenue;
            const cobradoEnvio = Number(order.shippingCost || 0);
            totalEnviosCobrados += cobradoEnvio;

            let customerState = 'Desconocido';
            let matchedZone = null;
            if (order.salesChannel === 'app') {
                if (order.shippingMethod === 'pickup') {
                    customerState = 'Retiro Local';
                    matchedZone = allShippingZones.find(zone =>
                        zone.zone.toLowerCase().includes('retiro') ||
                        zone.zone.toLowerCase().includes('local') ||
                        zone.zone.toLowerCase() === 'caba'
                    );
                } else if (order.shippingData?.address?.state) {
                    customerState = String(order.shippingData.address.state).toLowerCase().trim();
                    matchedZone = allShippingZones.find(zone => customerState.includes(zone.zone.toLowerCase().trim())) ||
                        allShippingZones.find(zone => zone.zone.toLowerCase() === 'resto del país');
                }
            }

            let costoRealEnvio = order.salesChannel === 'app' && matchedZone ? Number(matchedZone.realCost) : 0;
            const zoneName = order.salesChannel === 'mercadolibre'
                ? 'Mercado Envíos'
                : (matchedZone ? matchedZone.zone : (order.shippingMethod === 'pickup' ? 'Retiro Local' : customerState));
            const shippingSummary = breakdownShipping.get(zoneName) || { ord: 0, cobrado: 0, costoReal: 0 };
            shippingSummary.ord += 1;
            shippingSummary.cobrado += cobradoEnvio;
            breakdownShipping.set(zoneName, shippingSummary);

            let orderCosts = 0;
            let orderFixedCosts = 0;
            let orderVariableCosts = 0;
            let orderMarketplaceFees = 0;
            let orderPaymentFees = 0;
            let orderTaxes = 0;
            let orderEstimatedCosts = 0;
            let orderShippingFees = 0;
            for (const item of order.items) {
                const itemRevenue = Number(item.netRevenue ?? item.subtotal);
                ingresosProductos += itemRevenue;
                const productKey = `${order.salesChannel}:${item.externalItemId || item.productId}`;
                const productSummary = breakdownProducts.get(productKey) || {
                    id: item.productId,
                    publicationId: item.externalItemId || null,
                    name: item.productName,
                    channel: order.salesChannel,
                    units: 0,
                    internalUnits: 0,
                    ingresos: 0,
                    costos: 0,
                    fixedCosts: 0,
                    variableCosts: 0,
                    marketplaceFees: 0,
                    paymentFees: 0,
                    taxes: 0,
                    shippingCosts: 0,
                    estimatedCosts: 0,
                };
                productSummary.units += item.quantity;
                productSummary.internalUnits += Number(item.internalUnits || item.quantity);
                productSummary.ingresos += itemRevenue;

                for (const cost of item.costs) {
                    if (cost.affectsProfit === false) continue;
                    const amount = Number(cost.calculatedAmount);
                    const category = cost.category || 'operational';
                    const nature = cost.nature || (cost.costItemType === 'fixed' ? 'fixed' : 'variable');
                    const source = cost.source || 'configuration';
                    const isEstimated = cost.isEstimated ?? true;
                    const costKey = cost.costCode || `${cost.costItemName}:${category}:${nature}`;
                    const costSummary = breakdownCosts.get(costKey) || {
                        name: cost.costItemName,
                        type: cost.costItemType,
                        value: cost.configuredValue,
                        category,
                        nature,
                        source,
                        isEstimated,
                        totalAmount: 0,
                    };
                    costSummary.totalAmount += amount;
                    costSummary.isEstimated = costSummary.isEstimated || isEstimated;
                    breakdownCosts.set(costKey, costSummary);

                    if (isEstimated) {
                        totalEstimatedCosts += amount;
                        productSummary.estimatedCosts += amount;
                        orderEstimatedCosts += amount;
                    }

                    if (category === 'shipping_fee') {
                        orderShippingFees += amount;
                        productSummary.shippingCosts += amount;
                        productSummary.costos += amount;
                        continue;
                    }

                    totalCostos += amount;
                    orderCosts += amount;
                    productSummary.costos += amount;
                    const isSeparateChannelCost = ['marketplace_fee', 'payment_fee', 'tax'].includes(category);
                    if (!isSeparateChannelCost) {
                        if (nature === 'fixed') {
                            totalCostosFijos += amount;
                            productSummary.fixedCosts += amount;
                            orderFixedCosts += amount;
                        } else {
                            totalCostosVariables += amount;
                            productSummary.variableCosts += amount;
                            orderVariableCosts += amount;
                        }
                    }
                    if (category === 'marketplace_fee') {
                        totalMarketplaceFees += amount;
                        productSummary.marketplaceFees += amount;
                        orderMarketplaceFees += amount;
                    }
                    if (category === 'payment_fee') {
                        totalPaymentFees += amount;
                        productSummary.paymentFees += amount;
                        orderPaymentFees += amount;
                    }
                    if (category === 'tax') {
                        totalTaxes += amount;
                        productSummary.taxes += amount;
                        orderTaxes += amount;
                    }
                }
                breakdownProducts.set(productKey, productSummary);
            }

            if (order.salesChannel === 'mercadolibre') {
                costoRealEnvio = orderShippingFees;
            }
            totalEnviosCostosReales += costoRealEnvio;
            shippingSummary.costoReal += costoRealEnvio;
            breakdownShipping.set(zoneName, shippingSummary);

            const channelSummary = breakdownChannels.get(order.salesChannel) || { orders: 0, ingresos: 0, costos: 0, neto: 0 };
            channelSummary.orders += 1;
            channelSummary.ingresos += orderRevenue;
            channelSummary.costos += orderCosts + costoRealEnvio;
            channelSummary.neto += orderRevenue - orderCosts - costoRealEnvio;
            breakdownChannels.set(order.salesChannel, channelSummary);
            breakdownSales.push({
                id: order.id,
                orderNumber: order.orderNumber,
                externalOrderId: order.externalOrderId,
                channel: order.salesChannel,
                date: order.createdAt,
                ingresos: orderRevenue,
                fixedCosts: orderFixedCosts,
                variableCosts: orderVariableCosts,
                marketplaceFees: orderMarketplaceFees,
                paymentFees: orderPaymentFees,
                taxes: orderTaxes,
                shippingCost: costoRealEnvio,
                costos: orderCosts + costoRealEnvio,
                neto: orderRevenue - orderCosts - costoRealEnvio,
                financialStatus: order.financialStatus,
                hasEstimates: orderEstimatedCosts > 0,
            });
        }

        const resultadoEnvios = totalEnviosCobrados - totalEnviosCostosReales;
        const ingresosNetos = ingresosBrutos - totalCostos - totalEnviosCostosReales;
        const margenPorcentaje = ingresosBrutos > 0 ? ingresosNetos / ingresosBrutos * 100 : 0;

        const meliConditions: any[] = [];
        if (start) meliConditions.push(gte(meliOrders.dateCreated, new Date(`${start}T00:00:00`)));
        if (end) meliConditions.push(lte(meliOrders.dateCreated, new Date(`${end}T23:59:59.999`)));
        const unmatchedMeli = channel === 'app'
            ? []
            : await db.select().from(meliOrders).where(meliConditions.length > 0 ? and(...meliConditions) : undefined);
        const unmatchedCount = unmatchedMeli.filter(order => order.status === 'paid' && order.mappingStatus !== 'mapped').length;

        return new Response(JSON.stringify({
            summary: {
                ingresosBrutos,
                ingresosProductos,
                costosConfigurables: totalCostos,
                costosFijos: totalCostosFijos,
                costosVariables: totalCostosVariables,
                marketplaceFees: totalMarketplaceFees,
                paymentFees: totalPaymentFees,
                taxes: totalTaxes,
                estimatedCosts: totalEstimatedCosts,
                resultadoEnvios,
                costoRealEnvios: totalEnviosCostosReales,
                ingresosNetos,
                margenPorcentaje,
                unmatchedMeliOrders: unmatchedCount,
            },
            breakdownCosts: Array.from(breakdownCosts.values()),
            breakdownShipping: Array.from(breakdownShipping.entries()).map(([zone, value]) => ({ zone, ...value })),
            breakdownProducts: Array.from(breakdownProducts.values()),
            breakdownChannels: Array.from(breakdownChannels.entries()).map(([name, value]) => ({ name, ...value })),
            breakdownSales,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};
