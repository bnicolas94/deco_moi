export type InternalStockSource = {
    id: number;
    sku: string | null;
    stock: number | null;
    source: 'product' | 'product_variant' | 'variant_option';
};

export function normalizeSku(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLocaleUpperCase('es-AR');
    return normalized || null;
}

export function normalizePackQuantity(value: unknown): number {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('La cantidad del pack debe ser un número entero mayor o igual a 1');
    }
    return quantity;
}

export function isMeliStockPushEnabled(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

export function calculateMarketplaceStock(stock: unknown, packQuantity: unknown): number {
    const numericStock = Number(stock);
    if (!Number.isFinite(numericStock)) {
        throw new Error('El stock interno no es un número válido');
    }

    const quantity = normalizePackQuantity(packQuantity);
    return Math.floor(Math.max(0, numericStock) / quantity);
}

export function getMeliVariationSku(variation: any): string | null {
    const sellerSku = variation?.attributes?.find((attribute: any) => attribute?.id === 'SELLER_SKU');
    return normalizeSku(
        sellerSku?.value_name
        ?? sellerSku?.values?.[0]?.name
        ?? sellerSku?.value_id
    );
}

export function resolveVariationStockSource(
    variation: any,
    sources: InternalStockSource[]
): InternalStockSource {
    const variationSku = getMeliVariationSku(variation);
    if (!variationSku) {
        throw new Error('La variación de Mercado Libre no tiene el atributo SELLER_SKU');
    }

    const matches = sources.filter(source => normalizeSku(source.sku) === variationSku);
    if (matches.length === 0) {
        throw new Error(`No existe un producto o variante interna con SKU ${variationSku}`);
    }
    if (matches.length > 1) {
        throw new Error(`El SKU ${variationSku} coincide con más de una fuente de stock interna`);
    }

    return matches[0];
}
