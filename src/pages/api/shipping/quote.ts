import type { APIRoute } from 'astro';
import { quoteShipment, getShippingConfig } from '@/lib/services/ShippingService';
import type { ShippingQuoteItem, ShippingDestination } from '@/lib/services/ShippingService';
import { db } from '@/lib/db/connection';
import { products, productionTimeRules } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import {
    enrichQuoteWithProduction,
    resolveCartProductionLeadTime,
    resolveProductionLeadTime,
} from '@/lib/shipping/productionLeadTime';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { items: requestedItems, destination, declaredValue } = body as {
            items: Array<ShippingQuoteItem & { productId?: number }>;
            destination: ShippingDestination;
            declaredValue: number;
        };

        if (!requestedItems || requestedItems.length === 0 || requestedItems.length > 50) {
            return new Response(JSON.stringify({ error: 'No se proporcionaron items para cotizar' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!destination || !destination.zipcode) {
            return new Response(JSON.stringify({ error: 'Se requiere un código postal de destino' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const productIds = requestedItems.map((item) => Number(item.productId));
        if (productIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
            return new Response(JSON.stringify({ error: 'Los productos de la cotización no son válidos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const uniqueProductIds = [...new Set(productIds)];
        const [dbProducts, timeRules] = await Promise.all([
            db.select().from(products).where(inArray(products.id, uniqueProductIds)),
            db.select().from(productionTimeRules).where(inArray(productionTimeRules.productId, uniqueProductIds)),
        ]);
        const productById = new Map(dbProducts.map((product) => [product.id, product]));
        if (dbProducts.length !== new Set(productIds).size || dbProducts.some((product) => !product.isActive)) {
            return new Response(JSON.stringify({ error: 'Uno o más productos ya no están disponibles' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const items: ShippingQuoteItem[] = requestedItems.map((item) => {
            const product = productById.get(Number(item.productId))!;
            const quantity = Math.min(1_000, Math.max(1, Number(item.quantity) || 1));
            return {
                sku: product.sku || `PRODUCT-${product.id}`,
                description: product.name,
                weight: product.weight || 0,
                height: product.height || 0,
                width: product.width || 0,
                length: product.length || 0,
                quantity,
            };
        });
        const productionLead = resolveCartProductionLeadTime(requestedItems.map((item) => {
            const product = productById.get(Number(item.productId))!;
            const quantity = Math.min(1_000, Math.max(1, Number(item.quantity) || 1));
            return resolveProductionLeadTime(
                product,
                quantity,
                timeRules.filter((rule) => rule.productId === product.id),
            );
        }));
        const quotedAt = new Date();
        const includeProduction = (options: Awaited<ReturnType<typeof quoteShipment>>) =>
            options.map((option) => enrichQuoteWithProduction(option, productionLead, quotedAt));

        const config = await getShippingConfig();

        // Verificar si aplica envío gratis
        if (config.freeShippingEnabled && declaredValue >= config.freeShippingThreshold) {
            const quotedOptions = includeProduction(await quoteShipment(items, destination, declaredValue));
            return new Response(JSON.stringify({
                results: quotedOptions.map((option) => ({
                    ...option,
                    carrierCost: option.price,
                    price: 0,
                    priceInclTax: 0,
                })),
                freeShipping: true,
                productionLead,
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const results = includeProduction(await quoteShipment(items, destination, declaredValue));

        return new Response(JSON.stringify({ results, freeShipping: false, productionLead }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error al cotizar envío:', error);
        return new Response(JSON.stringify({ error: 'Error al cotizar el envío' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
