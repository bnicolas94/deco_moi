export function extractMeliOrderId(resource: unknown): string | null {
    if (typeof resource !== 'string') return null;
    return resource.match(/^\/orders\/(\d+)$/)?.[1] || null;
}

export function getImportRetryDelayMs(attempt: number): number {
    const delaysInMinutes = [1, 5, 15, 30, 60, 180, 360, 720];
    const index = Math.min(Math.max(Math.trunc(attempt), 1), delaysInMinutes.length) - 1;
    return delaysInMinutes[index] * 60_000;
}
