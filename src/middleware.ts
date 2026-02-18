import { defineMiddleware } from 'astro/middleware';
import { validateSessionToken, SESSION_COOKIE_NAME } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
    const token = context.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;

    if (token === null) {
        context.locals.user = null;
        context.locals.session = null;

        if (context.url.pathname.startsWith('/admin') && !context.url.pathname.startsWith('/admin/login')) {
            return context.redirect('/admin/login');
        }

        return next();
    }

    const { session, user } = await validateSessionToken(token);

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

    context.locals.session = session;
    context.locals.user = user;

    if (context.url.pathname.startsWith('/admin') && !context.url.pathname.startsWith('/admin/login')) {
        if (!user || user.role !== 'admin') {
            return context.redirect('/admin/login');
        }
    }

    if (context.url.pathname.startsWith('/admin/login') && user && user.role === 'admin') {
        return context.redirect('/admin');
    }

    return next();
});
