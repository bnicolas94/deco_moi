import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';

export type RequestContext = Parameters<APIRoute>[0];

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isSameOriginRequest(context: RequestContext): boolean {
    const origin = context.request.headers.get('origin');
    const fetchSite = context.request.headers.get('sec-fetch-site');

    if (fetchSite && fetchSite !== 'same-origin') {
        return false;
    }

    if (!origin) {
        return false;
    }

    const allowedOrigins = new Set<string>([context.url.origin]);
    const publicUrl = import.meta.env.PUBLIC_URL || process.env.PUBLIC_URL || 'https://decomoi.com.ar';

    try {
        allowedOrigins.add(new URL(publicUrl.replace(/"/g, '')).origin);
        return allowedOrigins.has(new URL(origin).origin);
    } catch {
        return false;
    }
}

export function requiresAdminApi(pathname: string, method: string): boolean {
    if (pathname === '/api/meli/webhook' || pathname.startsWith('/api/pages/slug/')) {
        return false;
    }

    if (pathname === '/api/mockup/templates') {
        return method !== 'GET';
    }

    if (pathname === '/api/orders') {
        return false;
    }

    const protectedPrefixes = [
        '/api/admin',
        '/api/categories',
        '/api/costs',
        '/api/meli',
        '/api/pages',
        '/api/products',
        '/api/supplies',
        '/api/supply-categories',
        '/api/orders',
    ];

    return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function requiresCsrfCheck(method: string): boolean {
    return UNSAFE_METHODS.has(method.toUpperCase());
}

export function verifyBearerSecret(authorization: string | null, expectedSecret: string): boolean {
    if (!authorization?.startsWith('Bearer ') || !expectedSecret) {
        return false;
    }

    const supplied = Buffer.from(authorization.slice('Bearer '.length), 'utf8');
    const expected = Buffer.from(expectedSecret, 'utf8');

    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
