import type { APIRoute } from 'astro';
import { MeliService } from '../../../lib/services/MeliService';

export const GET: APIRoute = async ({ request, redirect }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        console.error(`[Meli API] OAuth Error: ${error}`);
        return redirect('/admin/meli?error=oauth_failed');
    }

    if (!code) {
        return redirect('/admin/meli?error=no_code');
    }

    try {
        await MeliService.handleAuthCallback(code);
        return redirect('/admin/meli?success=auth_ok');
    } catch (err: any) {
        console.error('[Meli API] Error en callback OAuth', err);
        return redirect('/admin/meli?error=auth_exception');
    }
};
