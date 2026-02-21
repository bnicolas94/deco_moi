import { getValidAccessToken } from './auth';

const API_BASE = 'https://api.mercadolibre.com';

export interface MeliListingPricesResponse {
    currency_id: string;
    price: number;
    listing_type_id: string;
    listing_type_name: string;
    listing_exposure: string;
    requires_picture: boolean;
    sale_fee_amount: number;
    free_shipping_fee_amount: number | null;
    sale_fee_details: {
        percentage: number;
        amount: number;
    };
}

export async function getListingPrices(price: number, listingType: string = 'gold_special'): Promise<MeliListingPricesResponse[]> {
    const token = await getValidAccessToken();
    const url = `${API_BASE}/sites/MLA/listing_prices?price=${price}&listing_type_id=${listingType}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to get Meli listing prices: ${response.status} ${errText}`);
    }

    return response.json();
}

export async function getMeliItem(itemId: string) {
    const token = await getValidAccessToken();
    const url = `${API_BASE}/items/${itemId}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to get Meli item ${itemId}: ${response.status} ${errText}`);
    }

    return response.json();
}

/**
 * Updates price, stock and optionally the status of an item.
 */
export async function updateMeliItem(itemId: string, updates: {
    price?: number;
    available_quantity?: number;
    status?: 'active' | 'paused' | 'closed';
}) {
    const token = await getValidAccessToken();
    const url = `${API_BASE}/items/${itemId}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update Meli item ${itemId}: ${response.status} ${errText}`);
    }

    return response.json();
}
