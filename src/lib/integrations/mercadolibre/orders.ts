import { getValidAccessToken } from './auth';

const API_BASE = 'https://api.mercadolibre.com';

export interface MeliOrderSearchOptions {
    sellerId: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    offset?: number;
    limit?: number;
}

export interface MeliOrderResponse {
    id: number;
    status: string;
    date_created: string;
    date_closed: string;
    total_amount: number;
    currency_id: string;
    buyer: {
        id: number;
        nickname: string;
        email: string;
    };
    seller: {
        id: number;
    };
    order_items: Array<{
        item: {
            id: string;
            title: string;
            category_id: string;
            variation_id: number;
            seller_sku: string | null;
        };
        quantity: number;
        unit_price: number;
        sale_fee: number;
    }>;
    payments: Array<{
        id: number;
        status: string;
        transaction_amount: number;
        total_paid_amount: number;
    }>;
    shipping: {
        id: number;
        status: string;
    };
}

export async function searchMeliOrders(options: MeliOrderSearchOptions) {
    const token = await getValidAccessToken();

    const params = new URLSearchParams();
    params.append('seller', options.sellerId);
    params.append('sort', 'date_desc');

    if (options.dateFrom) params.append('order.date_created.from', options.dateFrom.toISOString());
    if (options.dateTo) params.append('order.date_created.to', options.dateTo.toISOString());
    if (options.status) params.append('order.status', options.status);
    if (options.offset !== undefined) params.append('offset', options.offset.toString());
    if (options.limit !== undefined) params.append('limit', options.limit.toString());

    const url = `${API_BASE}/orders/search?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to search Meli orders: ${response.status} ${errText}`);
    }

    return response.json();
}

export async function getMeliOrder(orderId: string | number): Promise<MeliOrderResponse> {
    const token = await getValidAccessToken();
    const url = `${API_BASE}/orders/${orderId}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to get Meli order ${orderId}: ${response.status} ${errText}`);
    }

    return response.json();
}
