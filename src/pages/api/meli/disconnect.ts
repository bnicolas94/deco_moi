import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/connection';
import { meliCredentials } from '../../../lib/db/schema';

export const POST: APIRoute = async ({ redirect }) => {
    try {
        // Desactivamos todas las credenciales existentes
        await db.update(meliCredentials).set({ isActive: false });

        return redirect('/admin/meli?success=disconnected');
    } catch (err: any) {
        console.error('[Meli API] Error al desconectar cuenta:', err);
        return redirect(`/admin/meli?error=${encodeURIComponent('No se pudo desconectar: ' + err.message)}`);
    }
};
