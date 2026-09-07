import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { products } from '@/lib/db/schema';
import { calculatePrice, getProductPriceRules } from '@/lib/services/ProductService';
import { getShippingConfig, quoteShipment } from '@/lib/services/ShippingService';
import { normalizeArgentinePostalCode, resolveArgentinePostalCode } from '@/lib/shipping/postalCode';
import { isSameOriginRequest } from '@/lib/security/request';

const MAX_QUANTITY = 1_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_MAX = 20;

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

function isRateLimited(request: Request): boolean {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const key = forwarded || request.headers.get('x-real-ip') || 'unknown';
    const store = ((globalThis as any).__PRODUCT_QUOTE_RATE_LIMIT ||= new Map<string, number[]>());
    const now = Date.now();
    const recent = (store.get(key) || []).filter((timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) return true;
    recent.push(now);
    store.set(key, recent);
    return false;
}

export const POST: APIRoute = async (context) => {
    if (!isSameOriginRequest(context)) {
        return json({ error: 'Origen de solicitud no permitido' }, 403);
    }
    if (isRateLimited(context.request)) {
        return json({ error: 'Hiciste varias cotizaciones seguidas. Esperá unos minutos y volvé a intentar.' }, 429);
    }

    try {
        const body = await context.request.json();
        const productId = Number(body?.productId);
        const postalCode = normalizeArgentinePostalCode(body?.postalCode);
        const requestedQuantity = Number(body?.quantity);

        if (!Number.isSafeInteger(productId) || productId <= 0 || !postalCode) {
            return json({ error: 'Ingresá un código postal argentino válido.' }, 400);
        }

        const [product] = await db.select().from(products).where(
            and(eq(products.id, productId), eq(products.isActive, true)),
        ).limit(1);
        if (!product) return json({ error: 'El producto ya no está disponible.' }, 404);

        const minimum = Math.max(1, Number(product.minOrder) || 1);
        const quantity = Number.isSafeInteger(requestedQuantity)
            ? Math.min(MAX_QUANTITY, Math.max(minimum, requestedQuantity))
            : minimum;
        const config = await getShippingConfig();
        if (!config.enabled) return json({ error: 'Los envíos no están disponibles en este momento.' }, 409);

        const basePrice = product.isOnSale && product.salePrice
            ? Number(product.salePrice)
            : Number(product.basePrice);
        const rules = await getProductPriceRules(product.id);
        const declaredValue = Math.round(calculatePrice(basePrice, rules, quantity) * quantity * 100) / 100;

        let location = { city: '', state: '', postalCode };
        if (!config.flatRateEnabled) {
            const resolved = await resolveArgentinePostalCode(postalCode);
            if (!resolved) {
                return json({ error: 'No pudimos identificar ese código postal. Revisalo e intentá nuevamente.' }, 404);
            }
            location = resolved;
        }

        const results = await quoteShipment([{
            sku: product.sku || `PRODUCT-${product.id}`,
            description: product.name,
            weight: product.weight || 0,
            height: product.height || 0,
            width: product.width || 0,
            length: product.length || 0,
            quantity,
        }], {
            city: location.city,
            state: location.state,
            zipcode: postalCode,
            country: 'AR',
        }, declaredValue);

        const homeDelivery = results
            .filter((result) => result.serviceType !== 'pickup_point')
            .sort((a, b) => a.price - b.price)
            .slice(0, 4)
            .map((result) => config.freeShippingEnabled && declaredValue >= config.freeShippingThreshold
                ? { ...result, carrierCost: result.price, price: 0, priceInclTax: 0 }
                : result);

        if (homeDelivery.length === 0) {
            return json({ error: 'No encontramos entregas a domicilio para ese código postal.' }, 404);
        }

        return json({
            results: homeDelivery,
            location,
            quantity,
            usesProductDimensions: Boolean(product.weight && product.height && product.width && product.length),
        });
    } catch (error) {
        console.error('[Product shipping quote] Error:', error);
        return json({ error: 'No pudimos cotizar ahora. Intentá nuevamente en unos minutos.' }, 502);
    }
};
