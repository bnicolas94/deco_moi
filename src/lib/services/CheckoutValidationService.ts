import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
    priceRules,
    products,
    productionTimeRules,
    productVariants,
    variantGroupOptions,
    variantGroups,
} from '@/lib/db/schema';
import { getBankTransferConfig, getCheckoutFields } from '@/lib/services/ConfigService';
import { getShippingConfig, quoteShipment } from '@/lib/services/ShippingService';
import type { ShippingQuoteItem, ShippingQuoteResult } from '@/lib/services/ShippingService';

const MAX_ITEMS = 50;
const MAX_QUANTITY = 10_000;
const MAX_OPTIONS_PER_ITEM = 20;
const MAX_TOTAL_UNITS = 10_000;
const MAX_TEXT_LENGTH = 500;
const MAX_REQUEST_BYTES = 256 * 1024;

export class CheckoutValidationError extends Error {
    constructor(message: string, public readonly status = 400) {
        super(message);
        this.name = 'CheckoutValidationError';
    }
}

export interface ValidatedCheckoutItem {
    id: number;
    name: string;
    slug: string;
    sku: string;
    image: string;
    quantity: number;
    price: number;
    variantId: number | null;
    variantName?: string;
    selectedOptions: Array<{
        groupName: string;
        optionName: string;
        optionId: number;
        priceModifier: number;
    }>;
    customization?: string;
    productionTime: string | null;
    shippingItem: ShippingQuoteItem;
}

export interface ValidatedCheckout {
    items: ValidatedCheckoutItem[];
    shippingData: Record<string, string>;
    shippingMethod: 'pickup' | 'delivery';
    selectedShipping: ShippingQuoteResult | null;
    paymentMethod: 'transfer' | 'mercadopago';
    notes: string;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    total: number;
}

type TrustedOptionSelection = {
    option: typeof variantGroupOptions.$inferSelect;
    group: typeof variantGroups.$inferSelect;
};

export async function parseCheckoutRequest(request: Request): Promise<unknown> {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
        throw new CheckoutValidationError('La solicitud debe enviarse como JSON', 415);
    }

    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
        throw new CheckoutValidationError('La solicitud es demasiado grande', 413);
    }

    if (!request.body) {
        throw new CheckoutValidationError('Solicitud de checkout inválida');
    }

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_REQUEST_BYTES) {
            await reader.cancel();
            throw new CheckoutValidationError('La solicitud es demasiado grande', 413);
        }
        chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    try {
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        throw new CheckoutValidationError('Solicitud de checkout inválida');
    }
}

function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function asInteger(value: unknown, field: string): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isSafeInteger(parsed)) {
        throw new CheckoutValidationError(`${field} inválido`);
    }
    return parsed;
}

function asPositiveInteger(value: unknown, field: string): number {
    const parsed = asInteger(value, field);
    if (parsed <= 0) {
        throw new CheckoutValidationError(`${field} inválido`);
    }
    return parsed;
}

function sanitizeText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
    if (value === null || value === undefined) return '';
    return String(value).trim().slice(0, maxLength);
}

function sanitizeShippingData(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new CheckoutValidationError('Datos de envío inválidos');
    }

    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 40) {
        throw new CheckoutValidationError('Demasiados campos en los datos de envío');
    }

    return Object.fromEntries(entries.map(([key, fieldValue]) => [
        key.slice(0, 100),
        sanitizeText(fieldValue, key === 'additional_notes' ? 2_000 : MAX_TEXT_LENGTH),
    ]));
}

function getApplicableUnitPrice(
    basePrice: number,
    optionsModifier: number,
    quantity: number,
    rules: Array<typeof priceRules.$inferSelect>,
): number {
    const applicableRule = rules
        .filter((rule) => quantity >= rule.minQuantity && (rule.maxQuantity === null || quantity <= rule.maxQuantity))
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    if (applicableRule?.fixedPrice !== null && applicableRule?.fixedPrice !== undefined) {
        return roundMoney(Number(applicableRule.fixedPrice) + optionsModifier);
    }

    const effectiveBase = basePrice + optionsModifier;
    const discount = applicableRule?.discountPercentage ? Number(applicableRule.discountPercentage) : 0;
    return roundMoney(effectiveBase * (1 - discount / 100));
}

function getProductionTime(
    fallback: string | null,
    quantity: number,
    rules: Array<typeof productionTimeRules.$inferSelect>,
): string | null {
    return rules
        .filter((rule) => quantity >= rule.minQuantity && (rule.maxQuantity === null || quantity <= rule.maxQuantity))
        .sort((a, b) => b.minQuantity - a.minQuantity)[0]?.productionTime
        || fallback;
}

export async function validateCheckoutPayload(payload: unknown): Promise<ValidatedCheckout> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new CheckoutValidationError('Solicitud de checkout inválida');
    }

    const body = payload as Record<string, any>;
    const rawItems = body.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
        throw new CheckoutValidationError('El carrito es inválido');
    }

    const paymentMethod = body.paymentMethod;
    if (paymentMethod !== 'transfer' && paymentMethod !== 'mercadopago') {
        throw new CheckoutValidationError('Método de pago inválido');
    }

    if (body.shippingMethod !== 'pickup' && body.shippingMethod !== 'delivery') {
        throw new CheckoutValidationError('Método de entrega inválido');
    }
    const shippingMethod = body.shippingMethod;
    const shippingData = sanitizeShippingData(body.shippingData);
    const notes = sanitizeText(body.notes, 2_000);
    const checkoutFields = await getCheckoutFields();

    for (const field of checkoutFields) {
        if (field.required && !shippingData[field.id]) {
            throw new CheckoutValidationError(`Falta completar ${field.label}`);
        }
    }

    if (shippingData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email)) {
        throw new CheckoutValidationError('El correo electrónico no es válido');
    }

    const quantities = rawItems.map((item) => asPositiveInteger(item?.quantity, 'Cantidad'));
    if (quantities.reduce((sum, quantity) => sum + quantity, 0) > MAX_TOTAL_UNITS) {
        throw new CheckoutValidationError('La cantidad total del carrito es demasiado grande');
    }

    for (const item of rawItems) {
        if (item?.selectedOptions !== undefined && !Array.isArray(item.selectedOptions)) {
            throw new CheckoutValidationError('Las opciones seleccionadas no son válidas');
        }
        if (item?.selectedOptions?.length > MAX_OPTIONS_PER_ITEM) {
            throw new CheckoutValidationError('Hay demasiadas opciones seleccionadas');
        }
    }

    const productIds = [...new Set(rawItems.map((item) => asPositiveInteger(item?.id, 'Producto')))];
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
    const productById = new Map(dbProducts.map((product) => [product.id, product]));

    if (dbProducts.length !== productIds.length || dbProducts.some((product) => !product.isActive)) {
        throw new CheckoutValidationError('Uno o más productos no están disponibles');
    }

    const [allVariants, allRules, allTimeRules, allGroups] = await Promise.all([
        db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
        db.select().from(priceRules).where(inArray(priceRules.productId, productIds)),
        db.select().from(productionTimeRules).where(inArray(productionTimeRules.productId, productIds)),
        db.select().from(variantGroups).where(inArray(variantGroups.productId, productIds)),
    ]);

    const selectedOptionIds = [...new Set(rawItems.flatMap((item) =>
        Array.isArray(item?.selectedOptions)
            ? item.selectedOptions.map((option: any) => asPositiveInteger(option?.optionId, 'Opción'))
            : [],
    ))];

    const selectedOptions: TrustedOptionSelection[] = selectedOptionIds.length > 0
        ? await db
            .select({ option: variantGroupOptions, group: variantGroups })
            .from(variantGroupOptions)
            .innerJoin(variantGroups, eq(variantGroupOptions.groupId, variantGroups.id))
            .where(and(inArray(variantGroupOptions.id, selectedOptionIds), inArray(variantGroups.productId, productIds)))
        : [];

    if (selectedOptions.length !== selectedOptionIds.length) {
        throw new CheckoutValidationError('Una o más opciones seleccionadas no son válidas');
    }

    const optionById = new Map<number, TrustedOptionSelection>(
        selectedOptions.map((selection) => [selection.option.id, selection]),
    );
    const variantsByProduct = new Map<number, Array<typeof productVariants.$inferSelect>>();
    for (const variant of allVariants) {
        const list = variantsByProduct.get(variant.productId) || [];
        list.push(variant);
        variantsByProduct.set(variant.productId, list);
    }

    const validatedItems: ValidatedCheckoutItem[] = [];

    for (const rawItem of rawItems) {
        const productId = asPositiveInteger(rawItem?.id, 'Producto');
        const quantity = asPositiveInteger(rawItem?.quantity, 'Cantidad');
        const product = productById.get(productId)!;
        const minimumOrder = product.minOrder || 1;

        if (quantity < minimumOrder || quantity > MAX_QUANTITY) {
            throw new CheckoutValidationError(`La cantidad de ${product.name} debe estar entre ${minimumOrder} y ${MAX_QUANTITY}`);
        }

        const productVariantsList = variantsByProduct.get(productId) || [];
        const hasVariantId = rawItem?.variantId !== null && rawItem?.variantId !== undefined && rawItem?.variantId !== '';
        const variantId = hasVariantId ? asPositiveInteger(rawItem.variantId, 'Variante') : null;
        const variant = variantId ? productVariantsList.find((candidate) => candidate.id === variantId) : undefined;
        const requestedVariantQuantity = variantId
            ? rawItems.reduce((sum, item) => {
                const candidateId = item?.variantId !== null && item?.variantId !== undefined && item?.variantId !== ''
                    ? asPositiveInteger(item.variantId, 'Variante')
                    : null;
                return candidateId === variantId ? sum + asPositiveInteger(item.quantity, 'Cantidad') : sum;
            }, 0)
            : 0;

        if (variantId && (!variant || !variant.isActive || (variant.stock ?? 0) < requestedVariantQuantity)) {
            throw new CheckoutValidationError(`La variante seleccionada de ${product.name} no está disponible`);
        }

        if (!variantId && productVariantsList.some((candidate) => candidate.isActive)) {
            throw new CheckoutValidationError(`Debés seleccionar una variante de ${product.name}`);
        }

        const rawOptionIds: number[] = Array.isArray(rawItem?.selectedOptions)
            ? rawItem.selectedOptions.map((option: any) => asPositiveInteger(option?.optionId, 'Opción'))
            : [];
        if (new Set(rawOptionIds).size !== rawOptionIds.length) {
            throw new CheckoutValidationError(`Hay opciones duplicadas en ${product.name}`);
        }

        const trustedOptions: TrustedOptionSelection[] = rawOptionIds.map((optionId: number) => {
            const selection = optionById.get(optionId);
            const requestedOptionQuantity = rawItems.reduce((sum, item) => {
                const hasOption = Array.isArray(item?.selectedOptions) && item.selectedOptions.some(
                    (option: any) => asPositiveInteger(option?.optionId, 'Opción') === optionId,
                );
                return hasOption ? sum + asPositiveInteger(item.quantity, 'Cantidad') : sum;
            }, 0);
            if (!selection || selection.group.productId !== productId || !selection.option.isActive || (selection.option.stock ?? 0) < requestedOptionQuantity) {
                throw new CheckoutValidationError(`Una opción seleccionada de ${product.name} no está disponible`);
            }
            return selection;
        });

        const selectedGroupIds = new Set(trustedOptions.map((selection) => selection.group.id));
        if (selectedGroupIds.size !== trustedOptions.length) {
            throw new CheckoutValidationError(`Solo podés seleccionar una opción por grupo en ${product.name}`);
        }

        const missingRequiredGroup = allGroups.some((group) =>
            group.productId === productId && group.isRequired && !selectedGroupIds.has(group.id),
        );
        if (missingRequiredGroup) {
            throw new CheckoutValidationError(`Falta seleccionar una opción requerida de ${product.name}`);
        }

        const basePrice = variant?.price !== null && variant?.price !== undefined
            ? Number(variant.price)
            : product.isOnSale && product.salePrice
                ? Number(product.salePrice)
                : Number(product.basePrice);
        const optionsModifier = trustedOptions.reduce((sum, selection) => sum + Number(selection.option.priceModifier || 0), 0);
        const rules = allRules.filter((rule) => rule.productId === productId);
        const unitPrice = getApplicableUnitPrice(basePrice, optionsModifier, quantity, rules);

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new CheckoutValidationError(`El precio de ${product.name} no es válido`, 500);
        }

        const sku = variant?.sku || product.sku || `SKU-${product.id}`;
        validatedItems.push({
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku,
            image: product.images?.[0] || '',
            quantity,
            price: unitPrice,
            variantId,
            variantName: variant?.name,
            selectedOptions: trustedOptions.map((selection) => ({
                groupName: selection.group.name,
                optionName: selection.option.name,
                optionId: selection.option.id,
                priceModifier: Number(selection.option.priceModifier || 0),
            })),
            customization: sanitizeText(rawItem?.customization, 2_000) || undefined,
            productionTime: getProductionTime(
                product.productionTime,
                quantity,
                allTimeRules.filter((rule) => rule.productId === productId),
            ),
            shippingItem: {
                sku,
                description: product.name,
                weight: product.weight || 0,
                height: product.height || 0,
                width: product.width || 0,
                length: product.length || 0,
                quantity,
            },
        });
    }

    const subtotal = roundMoney(validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
    let discountAmount = 0;

    if (paymentMethod === 'transfer') {
        const bankConfig = await getBankTransferConfig();
        const discount = Math.min(100, Math.max(0, Number(bankConfig.discount) || 0));
        discountAmount = roundMoney(subtotal * discount / 100);
    }

    const shippingConfig = await getShippingConfig();
    let selectedShipping: ShippingQuoteResult | null = null;
    let shippingCost = 0;

    if (shippingMethod === 'pickup') {
        if (!shippingConfig.pickupEnabled) {
            throw new CheckoutValidationError('El retiro en local no está disponible');
        }
    } else {
        if (!shippingConfig.enabled) {
            throw new CheckoutValidationError('Los envíos no están disponibles');
        }

        const destination = {
            city: shippingData.city,
            state: shippingData.state,
            zipcode: shippingData.postal_code,
            country: 'AR',
        };
        if (!destination.city || !destination.state || !destination.zipcode) {
            throw new CheckoutValidationError('Faltan ciudad, provincia o código postal para validar el envío');
        }

        if (shippingConfig.freeShippingEnabled && subtotal >= shippingConfig.freeShippingThreshold) {
            selectedShipping = {
                id: 'free_shipping',
                serviceType: 'free_shipping',
                serviceTypeName: 'Envío gratis',
                logisticType: 'free',
                logisticTypeName: 'Envío gratis',
                carrierName: 'Envío gratis',
                carrierId: 0,
                price: 0,
                priceInclTax: 0,
                estimatedDelivery: '',
                deliveryTimeHours: null,
            };
        } else {
            const quoteId = sanitizeText(body.selectedShipping?.id, 200);
            if (!quoteId) {
                throw new CheckoutValidationError('Debés seleccionar una opción de envío');
            }

            const quotes = await quoteShipment(validatedItems.map((item) => item.shippingItem), destination, subtotal);
            selectedShipping = quotes.find((quote) => quote.id === quoteId) || null;
            if (!selectedShipping) {
                throw new CheckoutValidationError('La opción de envío ya no está disponible. Volvé a cotizar.');
            }
            shippingCost = roundMoney(Number(selectedShipping.price));
            if (!Number.isFinite(shippingCost) || shippingCost < 0) {
                throw new CheckoutValidationError('El costo de envío no es válido', 500);
            }
        }
    }

    return {
        items: validatedItems,
        shippingData,
        shippingMethod,
        selectedShipping,
        paymentMethod,
        notes,
        subtotal,
        discountAmount,
        shippingCost,
        total: roundMoney(subtotal - discountAmount + shippingCost),
    };
}
