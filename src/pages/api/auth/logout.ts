import type { APIRoute } from 'astro';
import { invalidateSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export const POST: APIRoute = async (context) => {
    const sessionId = context.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
        await invalidateSession(sessionId);
    }

    context.cookies.delete(SESSION_COOKIE_NAME, {
        path: '/',
    });

    return context.redirect('/admin/login');
};
