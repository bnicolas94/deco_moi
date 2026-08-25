import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { meliOrderImportQueue } from '@/lib/db/schema';
import { getImportRetryDelayMs } from '@/lib/integrations/mercadolibre/webhook-queue';
import { BillingReconciliationService } from './BillingReconciliationService';
import { MeliService } from './MeliService';

type ClaimedQueueRow = {
    id: number;
    meli_order_id: string;
    attempts: number;
    received_at: Date | string;
};

export interface MeliQueueProcessingResult {
    claimed: number;
    imported: number;
    failed: number;
    superseded: number;
    reconciliation: { reconciled: number; partial: number; skipped: number; errors: number };
}

export class MeliOrderImportQueueService {
    static async processPending(limit = 20): Promise<MeliQueueProcessingResult> {
        const safeLimit = Math.min(Math.max(Math.trunc(limit) || 1, 1), 50);
        const claimResult = await db.execute(sql`
            UPDATE meli_order_import_queue
            SET status = 'processing', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id IN (
                SELECT id
                FROM meli_order_import_queue
                WHERE status IN ('pending', 'failed')
                  AND attempts < 8
                  AND next_attempt_at <= CURRENT_TIMESTAMP
                ORDER BY next_attempt_at ASC, id ASC
                FOR UPDATE SKIP LOCKED
                LIMIT ${safeLimit}
            )
            RETURNING id, meli_order_id, attempts, received_at
        `);
        const claimed = ((claimResult as any).rows || claimResult) as ClaimedQueueRow[];
        let imported = 0;
        let failed = 0;
        let superseded = 0;

        for (const row of claimed) {
            const receivedAt = row.received_at instanceof Date ? row.received_at : new Date(row.received_at);
            try {
                const outcome = await MeliService.importOrder(row.meli_order_id);
                if (!outcome.success) throw new Error(outcome.error || 'La importación no pudo completarse');

                const updated = await db.update(meliOrderImportQueue).set({
                    status: 'completed',
                    lastError: null,
                    processedAt: new Date(),
                    updatedAt: new Date(),
                }).where(and(
                    eq(meliOrderImportQueue.id, row.id),
                    eq(meliOrderImportQueue.status, 'processing'),
                    eq(meliOrderImportQueue.receivedAt, receivedAt)
                )).returning({ id: meliOrderImportQueue.id });
                if (updated.length > 0) imported++;
                else superseded++;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                const nextAttemptAt = new Date(Date.now() + getImportRetryDelayMs(row.attempts));
                const updated = await db.update(meliOrderImportQueue).set({
                    status: 'failed',
                    nextAttemptAt,
                    lastError: message,
                    updatedAt: new Date(),
                }).where(and(
                    eq(meliOrderImportQueue.id, row.id),
                    eq(meliOrderImportQueue.status, 'processing'),
                    eq(meliOrderImportQueue.receivedAt, receivedAt)
                )).returning({ id: meliOrderImportQueue.id });
                if (updated.length > 0) failed++;
                else superseded++;
            }
        }

        // Billing details can arrive later. Every worker run retries pending financial data.
        const reconciliation = await BillingReconciliationService.reconcilePendingOrders(60);
        return { claimed: claimed.length, imported, failed, superseded, reconciliation };
    }
}
