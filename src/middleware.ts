import { defineMiddleware } from 'astro/middleware';
import { validateSessionToken, SESSION_COOKIE_NAME } from './lib/auth';
import { db } from './lib/db/connection';
import { siteConfig } from './lib/db/schema';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
    // 1. Validar sesión primero
    const token = context.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    let session = null;
    let user = null;

    if (token !== null) {
        const result = await validateSessionToken(token);
        session = result.session;
        user = result.user;

        if (session) {
            context.cookies.set(SESSION_COOKIE_NAME, session.id, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
                expires: session.expiresAt,
            });
        } else {
            context.cookies.delete(SESSION_COOKIE_NAME, {
                path: '/',
            });
        }
    }

    context.locals.session = session;
    context.locals.user = user;

    const isAdmin = user !== null && user.role === 'admin';

    // 2. Comprobar Modo Mantenimiento
    // Excepciones: Rutas de admin, API, la propia página de mantenimiento,
    // assets estáticos y administradores logueados nunca son bloqueados
    const pathname = context.url.pathname;
    const isStaticAsset = pathname.startsWith('/_astro') ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/fonts') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.webp') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.woff2');

    const isMaintenanceExempt = pathname.startsWith('/admin') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/mantenimiento') ||
        isStaticAsset ||
        isAdmin;

    if (!isMaintenanceExempt) {
        // Obtenemos el cache si existe
        const now = Date.now();
        const globalCache = globalThis as any;

        let isMaintenanceActive = false;

        // Cache válido por 30 segundos
        if (
            globalCache.__MAINTENANCE_CACHE !== undefined &&
            globalCache.__MAINTENANCE_CACHE_EXPIRES !== undefined &&
            globalCache.__MAINTENANCE_CACHE_EXPIRES > now
        ) {
            isMaintenanceActive = globalCache.__MAINTENANCE_CACHE;
        } else {
            try {
                const result = await db.select()
                    .from(siteConfig)
                    .where(eq(siteConfig.key, 'maintenance_mode'))
                    .limit(1);

                if (result.length > 0 && result[0].value !== null) {
                    // El valor JSON podría estar en formato booleano o string
                    isMaintenanceActive = result[0].value === true || result[0].value === 'true';
                }

                // Guardar en cache por 30s
                globalCache.__MAINTENANCE_CACHE = isMaintenanceActive;
                globalCache.__MAINTENANCE_CACHE_EXPIRES = now + 30000;
            } catch (error) {
                console.error('Error fetching maintenance mode:', error);
                // Fallback: si falla la DB, no bloqueamos el sitio.
            }
        }

        if (isMaintenanceActive) {
            return context.redirect('/mantenimiento', 302);
        }
    }

    // 3. Proteger rutas de admin
    if (context.url.pathname.startsWith('/admin') && !context.url.pathname.startsWith('/admin/login')) {
        if (!isAdmin) {
            return context.redirect('/admin/login');
        }
    }

    // 4. Redirigir admin logueado si entra a login
    if (context.url.pathname.startsWith('/admin/login') && isAdmin) {
        return context.redirect('/admin');
    }

    return next();
});
