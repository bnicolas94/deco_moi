import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { siteConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * Endpoint para gestionar el estado de configuración "Mantenimiento"
 */
export const GET: APIRoute = async ({ cookies }) => {
    // Validar autorización: Solo admin puede leer esto.
    const token = cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { user } = await validateSessionToken(token);
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const result = await db.select().from(siteConfig).where(eq(siteConfig.key, 'maintenance_mode')).limit(1);
        let active = false;

        if (result.length > 0 && result[0].value !== null) {
            // El valor puede venir parseado ya o guardado como boolean JSON
            active = result[0].value === true || result[0].value === 'true';
        }

        return new Response(JSON.stringify({ active }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Error interno del servidor', details: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

export const POST: APIRoute = async ({ request, cookies }) => {
    // Validar autorización
    const token = cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { user } = await validateSessionToken(token);
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await request.json();
        const { active } = body;

        if (typeof active !== 'boolean') {
            return new Response(JSON.stringify({ error: 'El campo "active" debe ser booleano.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Insertar o actualizar el modo de mantenimiento en site_config
        await db.insert(siteConfig)
            .values({
                key: 'maintenance_mode',
                value: active,
                description: 'Activa o desactiva el modo mantenimiento del sitio',
            })
            .onConflictDoUpdate({
                target: siteConfig.key,
                set: { value: active },
            });

        // NOTA: EL middleware lee de esto, así que si cachea, el caché del middleware 
        // tiene que poder resetearse. Astro usa el globalThis para mantener memoria entre peticiones.
        // Simulamos invalidar el cache cambiando la fecha de caducidad en el global.
        if (typeof globalThis !== 'undefined') {
            (globalThis as any).__MAINTENANCE_CACHE_EXPIRES = 0; // Se fuerza la expiración
        }

        return new Response(JSON.stringify({ success: true, active }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Error interno del servidor', details: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
