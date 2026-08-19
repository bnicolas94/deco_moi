import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/security/request';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

type LoginAttempt = { count: number; resetAt: number };

function getLoginAttempts(): Map<string, LoginAttempt> {
    const globalState = globalThis as typeof globalThis & {
        __ADMIN_LOGIN_ATTEMPTS?: Map<string, LoginAttempt>;
    };

    globalState.__ADMIN_LOGIN_ATTEMPTS ??= new Map();
    return globalState.__ADMIN_LOGIN_ATTEMPTS;
}

function getClientAddress(request: Request): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
}

function registerFailedAttempt(key: string): void {
    const attempts = getLoginAttempts();
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
        return;
    }

    current.count += 1;
}

export const POST: APIRoute = async (context) => {
    if (!isSameOriginRequest(context)) {
        return new Response('Origen de solicitud no permitido', { status: 403 });
    }

    const formData = await context.request.formData();
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const password = formData.get('password')?.toString();

    if (!email || !password || email.length > 255 || password.length > 128) {
        return new Response('Email y contraseña requeridos', { status: 400 });
    }

    const attemptKey = `${getClientAddress(context.request)}:${email}`;
    const attempts = getLoginAttempts();
    const attempt = attempts.get(attemptKey);

    if (attempt && attempt.resetAt > Date.now() && attempt.count >= MAX_LOGIN_ATTEMPTS) {
        return context.redirect('/admin/login?error=Demasiados intentos. Intentá nuevamente en 15 minutos', 303);
    }

    if (attempt && attempt.resetAt <= Date.now()) {
        attempts.delete(attemptKey);
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !user.passwordHash) {
        registerFailedAttempt(attemptKey);
        return context.redirect('/admin/login?error=Credenciales inválidas', 303);
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        registerFailedAttempt(attemptKey);
        return context.redirect('/admin/login?error=Credenciales inválidas', 303);
    }

    if (user.role !== 'admin') {
        registerFailedAttempt(attemptKey);
        return context.redirect('/admin/login?error=Credenciales inválidas', 303);
    }

    attempts.delete(attemptKey);

    const session = await createSession(user.id);

    context.cookies.set(SESSION_COOKIE_NAME, session.id, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        expires: session.expiresAt,
    });

    return context.redirect('/admin', 303);
};
