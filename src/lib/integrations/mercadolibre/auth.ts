import { db } from '../../db/connection';
import { meliCredentials } from '../../db/schema';
import { eq } from 'drizzle-orm';

const API_BASE = 'https://api.mercadolibre.com';
const AUTH_BASE = 'https://auth.mercadolibre.com.ar/authorization';

export interface MLTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    user_id: number;
}

export async function getAuthUrl(): Promise<string> {
    const appId = import.meta.env.MELI_APP_ID || process.env.MELI_APP_ID;
    const redirectUri = import.meta.env.MELI_REDIRECT_URI || process.env.MELI_REDIRECT_URI;
    return `${AUTH_BASE}?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}`;
}

export async function exchangeCodeForToken(code: string): Promise<MLTokenResponse> {
    const appId = import.meta.env.MELI_APP_ID || process.env.MELI_APP_ID;
    const appSecret = import.meta.env.MELI_APP_SECRET || process.env.MELI_APP_SECRET;
    const redirectUri = import.meta.env.MELI_REDIRECT_URI || process.env.MELI_REDIRECT_URI;

    console.log('[MeliAuth] Intercambiando código con App ID:', appId, 'Redirect:', redirectUri);

    const url = `${API_BASE}/oauth/token`;
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: appSecret,
        code,
        redirect_uri: redirectUri,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to exchange Meli token: ${response.status} ${errText}`);
    }

    return response.json();
}

export async function refreshToken(refreshTokenStr: string): Promise<MLTokenResponse> {
    const appId = process.env.MELI_APP_ID || import.meta.env.MELI_APP_ID;
    const appSecret = process.env.MELI_APP_SECRET || import.meta.env.MELI_APP_SECRET;

    const url = `${API_BASE}/oauth/token`;
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: appId,
        client_secret: appSecret,
        refresh_token: refreshTokenStr,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to refresh Meli token: ${response.status} ${errText}`);
    }

    return response.json();
}

/**
 * Ensures the token is fresh, and returns the access_token snippet ready for use
 */
export async function getValidAccessToken(): Promise<string> {
    const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true)).limit(1);
    if (creds.length === 0) {
        throw new Error('No active MercadoLibre credentials found');
    }

    const credential = creds[0];

    // If expiring in less than 30 minutes (30 * 60 * 1000 = 1800000ms), refresh
    const now = new Date();
    const timeUntilExpiration = credential.expiresAt.getTime() - now.getTime();

    if (timeUntilExpiration < 1800000) {
        console.log('[MeliAuth] Refreshing token...');
        try {
            const refreshed = await refreshToken(credential.refreshToken);
            const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

            await db.update(meliCredentials)
                .set({
                    accessToken: refreshed.access_token,
                    refreshToken: refreshed.refresh_token,
                    expiresAt: newExpiresAt,
                    updatedAt: new Date()
                })
                .where(eq(meliCredentials.id, credential.id));

            return refreshed.access_token;
        } catch (e) {
            console.error('[MeliAuth] Error refreshing token', e);
            throw e;
        }
    }

    return credential.accessToken;
}
