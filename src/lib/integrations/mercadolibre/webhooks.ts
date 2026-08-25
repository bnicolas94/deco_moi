import { db } from '../../db/connection';
import { meliCredentials, meliOrderImportQueue } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { extractMeliOrderId } from './webhook-queue';

export interface MeliWebhookPayload {
    resource: string;
    user_id: string | number;
    topic: string;
    application_id: string | number;
    attempts: number;
    sent: string;
    received: string;
}

export class MeliWebhookValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MeliWebhookValidationError';
    }
}

export async function enqueueOrderWebhook(payload: MeliWebhookPayload): Promise<string> {
    if (payload.topic !== 'orders_v2') {
        throw new MeliWebhookValidationError(`Topic no soportado: ${payload.topic || 'vacío'}`);
    }

    // 1. Verify user_id matches our credentials
    const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true)).limit(1);
    if (creds.length === 0) {
        throw new MeliWebhookValidationError('No hay credenciales activas de Mercado Libre');
    }

    const credential = creds[0];
    if (String(credential.mlUserId) !== String(payload.user_id)) {
        throw new MeliWebhookValidationError(`El user_id ${payload.user_id} no coincide con las credenciales activas`);
    }
    if (credential.appId && String(credential.appId) !== String(payload.application_id)) {
        throw new MeliWebhookValidationError(`El application_id ${payload.application_id} no coincide con la aplicación activa`);
    }

    // 2. Extract Order ID
    const orderId = extractMeliOrderId(payload.resource);
    if (!orderId) {
        throw new MeliWebhookValidationError(`Recurso de orden no válido: ${payload.resource}`);
    }

    // 3. Upsert by order: repeated notifications simply request a fresh read from ML.
    const now = new Date();
    await db.insert(meliOrderImportQueue).values({
        meliOrderId: orderId,
        userId: String(payload.user_id),
        status: 'pending',
        attempts: 0,
        nextAttemptAt: now,
        lastError: null,
        payload: payload as unknown as Record<string, any>,
        receivedAt: now,
        processedAt: null,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: meliOrderImportQueue.meliOrderId,
        set: {
            userId: String(payload.user_id),
            status: 'pending',
            attempts: 0,
            nextAttemptAt: now,
            lastError: null,
            payload: payload as unknown as Record<string, any>,
            receivedAt: now,
            processedAt: null,
            updatedAt: now,
        },
    });

    return orderId;
}
