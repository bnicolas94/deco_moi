import { getValidAccessToken } from './auth';

const API_BASE = 'https://api.mercadolibre.com';

export async function getMeliShipment(shipmentId: string | number) {
    const token = await getValidAccessToken();
    const response = await fetch(`${API_BASE}/shipments/${shipmentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'x-format-new': 'true',
        },
    });

    if (!response.ok && response.status !== 206) {
        throw new Error(`Failed to get Meli shipment ${shipmentId}: ${response.status} ${await response.text()}`);
    }

    return response.json();
}
