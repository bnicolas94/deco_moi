import type { ShippingQuoteResult } from './zipnovaQuote.ts';

export interface ProductionLeadTime {
    minBusinessDays: number;
    maxBusinessDays: number;
    label: string;
}

type ProductionSource = {
    productionTime?: string | null;
    productionMinBusinessDays?: number | null;
    productionMaxBusinessDays?: number | null;
};

type ProductionRule = ProductionSource & {
    minQuantity: number;
    maxQuantity: number | null;
};

function safeDays(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 365 ? parsed : null;
}

export function formatProductionLeadTime(minBusinessDays: number, maxBusinessDays: number): string {
    const min = Math.max(0, Math.min(minBusinessDays, maxBusinessDays));
    const max = Math.max(min, maxBusinessDays);
    if (min === max) return `${max} ${max === 1 ? 'día hábil' : 'días hábiles'}`;
    return `${min}–${max} días hábiles`;
}

export function parseLegacyProductionTime(value: unknown): ProductionLeadTime | null {
    const numbers = String(value || '').match(/\d+/g)?.map(Number).filter((day) => day >= 0 && day <= 365) || [];
    if (numbers.length === 0) return null;
    const min = Math.min(numbers[0], numbers[1] ?? numbers[0]);
    const max = Math.max(numbers[0], numbers[1] ?? numbers[0]);
    return { minBusinessDays: min, maxBusinessDays: max, label: formatProductionLeadTime(min, max) };
}

export function normalizeProductionLeadTime(source: ProductionSource | null | undefined): ProductionLeadTime {
    const numericMin = safeDays(source?.productionMinBusinessDays);
    const numericMax = safeDays(source?.productionMaxBusinessDays);
    if ((numericMin || numericMax) || !source?.productionTime) {
        const min = Math.min(numericMin ?? numericMax ?? 0, numericMax ?? numericMin ?? 0);
        const max = Math.max(numericMin ?? numericMax ?? 0, numericMax ?? numericMin ?? 0);
        return { minBusinessDays: min, maxBusinessDays: max, label: formatProductionLeadTime(min, max) };
    }
    return parseLegacyProductionTime(source.productionTime)
        || { minBusinessDays: 0, maxBusinessDays: 0, label: formatProductionLeadTime(0, 0) };
}

export function resolveProductionLeadTime(
    product: ProductionSource,
    quantity: number,
    rules: ProductionRule[],
): ProductionLeadTime {
    const applicable = rules
        .filter((rule) => quantity >= rule.minQuantity && (rule.maxQuantity === null || quantity <= rule.maxQuantity))
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    return normalizeProductionLeadTime(applicable || product);
}

export function resolveCartProductionLeadTime(leads: ProductionLeadTime[]): ProductionLeadTime {
    const min = Math.max(0, ...leads.map((lead) => lead.minBusinessDays));
    const max = Math.max(min, ...leads.map((lead) => lead.maxBusinessDays));
    return { minBusinessDays: min, maxBusinessDays: max, label: formatProductionLeadTime(min, max) };
}

export function addBusinessDays(value: string | Date, businessDays: number): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date(NaN);
    let remaining = Math.max(0, Math.floor(businessDays));
    while (remaining > 0) {
        date.setUTCDate(date.getUTCDate() + 1);
        const weekday = date.getUTCDay();
        if (weekday !== 0 && weekday !== 6) remaining--;
    }
    return date;
}

export function countBusinessDays(from: string | Date, to: string | Date): number {
    const cursor = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || end <= cursor) return 0;
    let result = 0;
    cursor.setUTCHours(12, 0, 0, 0);
    end.setUTCHours(12, 0, 0, 0);
    while (cursor < end) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        const weekday = cursor.getUTCDay();
        if (weekday !== 0 && weekday !== 6) result++;
    }
    return result;
}

export function enrichQuoteWithProduction(
    quote: ShippingQuoteResult,
    lead: ProductionLeadTime,
    quotedAt = new Date(),
): ShippingQuoteResult {
    const zipnovaEstimatedDelivery = quote.zipnovaEstimatedDelivery || quote.estimatedDelivery || '';
    const customerDate = zipnovaEstimatedDelivery
        ? addBusinessDays(zipnovaEstimatedDelivery, lead.maxBusinessDays)
        : null;
    const customerEstimatedDelivery = customerDate && !Number.isNaN(customerDate.getTime())
        ? customerDate.toISOString()
        : '';

    return {
        ...quote,
        zipnovaEstimatedDelivery,
        estimatedDelivery: customerEstimatedDelivery || quote.estimatedDelivery,
        quotedEstimatedDelivery: customerEstimatedDelivery || quote.quotedEstimatedDelivery || quote.estimatedDelivery,
        customerEstimatedDelivery,
        productionMinBusinessDays: lead.minBusinessDays,
        productionMaxBusinessDays: lead.maxBusinessDays,
        productionTimeLabel: lead.label,
        productionReadyFrom: addBusinessDays(quotedAt, lead.minBusinessDays).toISOString(),
        productionReadyBy: addBusinessDays(quotedAt, lead.maxBusinessDays).toISOString(),
        quotedAt: quotedAt.toISOString(),
    };
}

export function buildFulfillmentSnapshot(
    selectedShipping: Partial<ShippingQuoteResult> | null | undefined,
    paymentApproved: boolean,
    startedAt = new Date(),
) {
    const min = safeDays(selectedShipping?.productionMinBusinessDays) ?? 0;
    const max = Math.max(min, safeDays(selectedShipping?.productionMaxBusinessDays) ?? min);
    const quotedAt = selectedShipping?.quotedAt ? new Date(selectedShipping.quotedAt) : startedAt;
    const paymentDelay = paymentApproved ? countBusinessDays(quotedAt, startedAt) : 0;
    const originalPromise = selectedShipping?.quotedEstimatedDelivery || selectedShipping?.estimatedDelivery || '';
    const shiftedPromise = originalPromise && paymentDelay > 0
        ? addBusinessDays(originalPromise, paymentDelay).toISOString()
        : originalPromise;

    return {
        status: paymentApproved ? 'in_production' : 'awaiting_payment',
        productionMinBusinessDays: min,
        productionMaxBusinessDays: max,
        productionTimeLabel: selectedShipping?.productionTimeLabel || formatProductionLeadTime(min, max),
        productionStartedAt: paymentApproved ? startedAt.toISOString() : null,
        productionReadyFrom: paymentApproved ? addBusinessDays(startedAt, min).toISOString() : null,
        productionReadyBy: paymentApproved ? addBusinessDays(startedAt, max).toISOString() : null,
        promisedDelivery: shiftedPromise || null,
        quoteCreatedAt: selectedShipping?.quotedAt || null,
    };
}
