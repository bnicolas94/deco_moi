import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export const POST: APIRoute = async (context) => {
    const formData = await context.request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
        return new Response('Email y contraseña requeridos', { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !user.passwordHash) {
        return context.redirect('/admin/login?error=Credenciales inválidas');
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        return context.redirect('/admin/login?error=Credenciales inválidas');
    }

    if (user.role !== 'admin') {
        return context.redirect('/admin/login?error=No tienes permisos de administrador');
    }

    const session = await createSession(user.id);

    context.cookies.set(SESSION_COOKIE_NAME, session.id, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        expires: session.expiresAt,
    });

    return context.redirect('/admin');
};
