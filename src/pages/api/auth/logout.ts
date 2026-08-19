import type { APIRoute } from 'astro';
import { invalidateSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/security/request';

export const POST: APIRoute = async (context) => {
    if (!isSameOriginRequest(context)) {
        return new Response('Origen de solicitud no permitido', { status: 403 });
    }

    const sessionId = context.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
        await invalidateSession(sessionId);
    }

    context.cookies.delete(SESSION_COOKIE_NAME, {
        path: '/',
    });

    return context.redirect('/admin/login');
};
