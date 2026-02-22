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
    variationId?: string | null;
}) {
    const token = await getValidAccessToken();
    const url = `${API_BASE}/items/${itemId}`;

    let body = {};
    if (updates.variationId) {
        // Update specific variation
        body = {
            variations: [
                {
                    id: updates.variationId,
                    price: updates.price,
                    available_quantity: updates.available_quantity
                }
            ],
            status: updates.status
        };
    } else {
        // Root item update
        body = {
            price: updates.price,
            available_quantity: updates.available_quantity,
            status: updates.status
        };
    }

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update Meli item ${itemId}: ${response.status} ${errText}`);
    }

    return response.json();
}

/**
 * Retrieves all items (active, paused, closed) for a given seller.
 * Uses the /users/{userId}/items/search endpoint to get IDs,
 * then fetches the full item details.
 */
export async function getAllSellerItems(userId: string, limit: number = 50, offset: number = 0) {
    const token = await getValidAccessToken();

    // 1. Get the item IDs
    const searchUrl = `${API_BASE}/users/${userId}/items/search?limit=${limit}&offset=${offset}`;
    const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!searchRes.ok) {
        const errText = await searchRes.text();
        throw new Error(`Failed to search seller items: ${searchRes.status} ${errText}`);
    }

    const searchData = await searchRes.json();
    const itemIds: string[] = searchData.results || [];

    if (itemIds.length === 0) {
        return {
            paging: searchData.paging,
            items: []
        };
    }

    // 2. Fetch full details for the retrieved IDs
    // ML API allows up to 20 IDs per request on /items?ids=
    const items: any[] = [];
    for (let i = 0; i < itemIds.length; i += 20) {
        const chunk = itemIds.slice(i, i + 20);
        const itemsUrl = `${API_BASE}/items?ids=${chunk.join(',')}`;

        const itemsRes = await fetch(itemsUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!itemsRes.ok) {
            console.error(`Failed to fetch item chunk ${chunk.join(',')}`);
            continue;
        }

        const itemsData = await itemsRes.json();
        itemsData.forEach((res: any) => {
            if (res.code === 200) {
                items.push(res.body);
            }
        });
    }

    return {
        paging: searchData.paging,
        items
    };
}
