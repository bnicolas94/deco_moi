import { db } from '../db/connection';
import { siteConfig } from '../db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// TIPOS
// ============================================

export interface ShippingConfig {
    enabled: boolean;
    flatRateEnabled: boolean;
    flatRate: number;
    freeShippingEnabled: boolean;
    freeShippingThreshold: number;
    defaultWeight: number;   // gramos
    defaultHeight: number;   // cm
    defaultWidth: number;    // cm
    defaultLength: number;   // cm
    pickupEnabled: boolean;
    pickupLabel: string;
    pickupAddress: string;
}

export interface ShippingQuoteItem {
    sku: string;
    description: string;
    weight: number;   // gramos
    height: number;   // cm
    width: number;    // cm
    length: number;   // cm
    quantity: number;
}

export interface ShippingDestination {
    city: string;
    state: string;
    zipcode: string;
    country?: string;
}

export interface ShippingQuoteResult {
    id: string;
    serviceType: string;
    serviceTypeName: string;
    logisticType: string;
    logisticTypeName: string;
    carrierName: string;
    carrierId: number;
    price: number;
    priceInclTax: number;
    estimatedDelivery: string;
    deliveryTimeHours: number | null;
}

export interface ZipnovaQuoteResponse {
    sorted_by: string;
    results: Array<{
        service_type: { id: number; code: string; name: string; description: string };
        logistic_type: { id: number; code: string; name: string; description: string };
        carrier: { id: number; name: string };
        delivery_time: {
            estimated_delivery: string;
            estimation_expires_at: string;
            times: { preparation: string; shipping: string; total: string };
        };
        amounts: {
            price: number;
            price_incl_tax: number;
            seller_price: number;
            seller_price_incl_tax: number;
            price_shipment: number;
            price_insurance: number;
        };
        packages: any[];
        pickup_points?: any[];
    }>;
    all_results?: any[];
}

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
    enabled: true,
    flatRateEnabled: false,
    flatRate: 0,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    defaultWeight: 500,    // 500g
    defaultHeight: 10,     // 10cm
    defaultWidth: 15,      // 15cm
    defaultLength: 20,     // 20cm
    pickupEnabled: true,
    pickupLabel: 'Retiro en local',
    pickupAddress: '',
};

const SITE_CONFIG_KEY = 'shipping_settings';

// ============================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================

export async function getShippingConfig(): Promise<ShippingConfig> {
    try {
        const result = await db
            .select()
            .from(siteConfig)
            .where(eq(siteConfig.key, SITE_CONFIG_KEY))
            .limit(1);

        if (result.length === 0) {
            return DEFAULT_SHIPPING_CONFIG;
        }

        return { ...DEFAULT_SHIPPING_CONFIG, ...(result[0].value as Partial<ShippingConfig>) };
    } catch {
        return DEFAULT_SHIPPING_CONFIG;
    }
}

export async function updateShippingConfig(config: Partial<ShippingConfig>): Promise<void> {
    const current = await getShippingConfig();
    const merged = { ...current, ...config };

    const existing = await db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, SITE_CONFIG_KEY))
        .limit(1);

    if (existing.length === 0) {
        await db.insert(siteConfig).values({
            key: SITE_CONFIG_KEY,
            value: merged,
            description: 'Configuración del sistema de envíos',
            updatedAt: new Date(),
        });
    } else {
        await db
            .update(siteConfig)
            .set({ value: merged, updatedAt: new Date() })
            .where(eq(siteConfig.key, SITE_CONFIG_KEY));
    }
}

// ============================================
// CLIENTE API ZIPNOVA
// ============================================

function getZipnovaCredentials() {
    const token = import.meta.env.ZIPNOVA_API_TOKEN;
    const secret = import.meta.env.ZIPNOVA_API_SECRET;
    const accountId = import.meta.env.ZIPNOVA_ACCOUNT_ID;
    const originId = import.meta.env.ZIPNOVA_ORIGIN_ID;
    const domain = import.meta.env.ZIPNOVA_DOMAIN || 'zipnova.com.ar';

    return { token, secret, accountId, originId, domain };
}

function getAuthHeader(): string {
    const { token, secret } = getZipnovaCredentials();
    const encoded = Buffer.from(`${token}:${secret}`).toString('base64');
    return `Basic ${encoded}`;
}

function getBaseUrl(): string {
    const { domain } = getZipnovaCredentials();
    return `https://api.${domain}/v2`;
}

function areCredentialsConfigured(): boolean {
    const { token, secret, accountId, originId } = getZipnovaCredentials();
    return !!(token && secret && accountId && originId);
}

// ============================================
// COTIZACIÓN DE ENVÍOS
// ============================================

export async function quoteShipment(
    items: ShippingQuoteItem[],
    destination: ShippingDestination,
    declaredValue: number
): Promise<ShippingQuoteResult[]> {
    const config = await getShippingConfig();

    // Si envíos no están habilitados, retornar vacío
    if (!config.enabled) {
        return [];
    }

    // Si se usa tarifa fija, retornar directamente
    if (config.flatRateEnabled && config.flatRate > 0) {
        return [{
            id: 'flat_rate',
            serviceType: 'flat_rate',
            serviceTypeName: 'Envío estándar',
            logisticType: 'flat_rate',
            logisticTypeName: 'Tarifa fija',
            carrierName: 'Envío estándar',
            carrierId: 0,
            price: config.flatRate,
            priceInclTax: config.flatRate,
            estimatedDelivery: '',
            deliveryTimeHours: null,
        }];
    }

    // Verificar credenciales de Zipnova
    if (!areCredentialsConfigured()) {
        console.warn('[Zipnova] Credenciales no configuradas, no se puede cotizar');
        return [];
    }

    // Expandir items por cantidad y aplicar dimensiones por defecto
    const zipnovaItems = items.flatMap(item => {
        const expandedItems = [];
        for (let i = 0; i < item.quantity; i++) {
            expandedItems.push({
                sku: item.sku || `SKU-${Date.now()}`,
                description: item.description,
                weight: item.weight || config.defaultWeight,
                height: item.height || config.defaultHeight,
                width: item.width || config.defaultWidth,
                length: item.length || config.defaultLength,
                classification_id: 1, // General
            });
        }
        return expandedItems;
    });

    const { accountId, originId } = getZipnovaCredentials();

    const body = {
        account_id: accountId,
        origin_id: originId,
        declared_value: declaredValue,
        destination: {
            city: destination.city,
            state: destination.state,
            zipcode: destination.zipcode,
            country: destination.country || 'AR',
        },
        items: zipnovaItems,
        source: 'decomoi_web',
    };

    try {
        const url = `${getBaseUrl()}/shipments/quote`;
        console.log('[Zipnova] URL:', url);
        console.log('[Zipnova] Request body:', JSON.stringify(body, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeader(),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Zipnova] Error al cotizar: ${response.status} - ${errorText}`);
            return [];
        }

        const data = await response.json();
        console.log('[Zipnova] Respuesta completa:', JSON.stringify(data, null, 2));

        // Buscar el array de resultados — la API puede retornarlo en diferentes estructuras
        let resultsArray: any[] = [];

        if (Array.isArray(data)) {
            // La respuesta es directamente un array
            resultsArray = data;
        } else if (Array.isArray(data.results)) {
            resultsArray = data.results;
        } else if (Array.isArray(data.all_results)) {
            resultsArray = data.all_results;
        } else if (data.results && typeof data.results === 'object') {
            // Si results es un objeto, intentar convertirlo a array
            resultsArray = Object.values(data.results);
        } else if (data.data && Array.isArray(data.data)) {
            resultsArray = data.data;
        }

        console.log(`[Zipnova] Resultados encontrados: ${resultsArray.length}`);

        if (resultsArray.length === 0) {
            console.warn('[Zipnova] No se encontraron opciones de envío');
            return [];
        }

        return resultsArray.map((result: any, index: number) => {
            // Manejar diferentes posibles estructuras de cada resultado
            const serviceType = result.service_type || {};
            const logisticType = result.logistic_type || {};
            const carrier = result.carrier || {};
            const amounts = result.amounts || result.price || {};
            const deliveryTime = result.delivery_time || {};

            return {
                id: `zipnova_${index}_${carrier.id || index}_${serviceType.code || 'std'}`,
                serviceType: serviceType.code || serviceType.id?.toString() || '',
                serviceTypeName: serviceType.name || serviceType.description || 'Envío estándar',
                logisticType: logisticType.code || logisticType.id?.toString() || '',
                logisticTypeName: logisticType.name || logisticType.description || '',
                carrierName: carrier.name || 'Correo',
                carrierId: carrier.id || 0,
                price: amounts.price_incl_tax || amounts.price || amounts.total || 0,
                priceInclTax: amounts.price_incl_tax || amounts.price || amounts.total || 0,
                estimatedDelivery: deliveryTime.estimated_delivery || '',
                deliveryTimeHours: null,
            };
        });
    } catch (error) {
        console.error('[Zipnova] Error de red al cotizar:', error);
        return [];
    }
}

// ============================================
// CREACIÓN DE ENVÍOS
// ============================================

export interface CreateShipmentData {
    items: ShippingQuoteItem[];
    destination: {
        name: string;
        street: string;
        streetNumber: string;
        streetExtras?: string;
        city: string;
        state: string;
        zipcode: string;
        document: string;
        email: string;
        phone: string;
        country?: string;
    };
    declaredValue: number;
    externalId: string;
    serviceType: string;
    logisticType: string;
    carrierId: number;
}

export async function createShipment(data: CreateShipmentData): Promise<any> {
    if (!areCredentialsConfigured()) {
        throw new Error('Credenciales de Zipnova no configuradas');
    }

    const config = await getShippingConfig();
    const { accountId, originId } = getZipnovaCredentials();

    const zipnovaItems = data.items.flatMap(item => {
        const expanded = [];
        for (let i = 0; i < item.quantity; i++) {
            expanded.push({
                sku: item.sku || `SKU-${Date.now()}`,
                description: item.description,
                weight: item.weight || config.defaultWeight,
                height: item.height || config.defaultHeight,
                width: item.width || config.defaultWidth,
                length: item.length || config.defaultLength,
                classification_id: 1,
            });
        }
        return expanded;
    });

    const body = {
        account_id: accountId,
        origin_id: originId,
        logistic_type: data.logisticType,
        service_type: data.serviceType,
        carrier_id: data.carrierId,
        declared_value: data.declaredValue,
        external_id: data.externalId,
        source: 'decomoi_web',
        destination: {
            name: data.destination.name,
            street: data.destination.street,
            street_number: data.destination.streetNumber,
            street_extras: data.destination.streetExtras || '',
            city: data.destination.city,
            state: data.destination.state,
            zipcode: data.destination.zipcode,
            document: data.destination.document,
            email: data.destination.email,
            phone: data.destination.phone,
            country: data.destination.country || 'AR',
        },
        items: zipnovaItems,
    };

    const response = await fetch(`${getBaseUrl()}/shipments`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear envío en Zipnova: ${response.status} - ${errorText}`);
    }

    return await response.json();
}
