import { getMeliOrder } from './orders';
import { db } from '../../db/connection';
import { meliOrders, meliCredentials, products, meliItemLinks } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface MeliWebhookPayload {
    resource: string;
    user_id: string | number;
    topic: string;
    application_id: string | number;
    attempts: number;
    sent: string;
    received: string;
}

export async function processOrderWebhook(payload: MeliWebhookPayload): Promise<void> {
    // 1. Verify user_id matches our credentials
    const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true)).limit(1);
    if (creds.length === 0) {
        throw new Error('No active ML credentials, cannot process webhook');
    }

    const credential = creds[0];
    if (String(credential.mlUserId) !== String(payload.user_id)) {
        throw new Error(`Webhook user_id ${payload.user_id} does not match active credentials`);
    }

    // 2. Extract Order ID
    const orderIdMatch = payload.resource.match(/\/orders\/(\d+)/);
    if (!orderIdMatch) {
        console.warn(`[Meli Webhook] Resource not recognized as order: ${payload.resource}`);
        return;
    }

    const orderId = orderIdMatch[1];

    // 3. Process the order details (this should be moved to MeliService to avoid circular loops
    // but keeping basic logic here or delegating to MeliService)
    // I will just export a basic structure here and let MeliService handle the orchestration.
}
