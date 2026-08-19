import type { APIRoute } from 'astro';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { sessions, users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth';

const redirectWithError = (context: Parameters<APIRoute>[0], error: string) =>
    context.redirect(`/admin/account?error=${error}`, 303);

export const POST: APIRoute = async (context) => {
    const { user, session } = context.locals;

    if (!user || user.role !== 'admin' || !session || !user.passwordHash) {
        return new Response('No autorizado', { status: 401 });
    }

    const origin = context.request.headers.get('origin');
    if (!origin || origin !== context.url.origin) {
        return redirectWithError(context, 'invalid_request');
    }

    let formData: FormData;
    try {
        formData = await context.request.formData();
    } catch {
        return redirectWithError(context, 'invalid_request');
    }

    const currentPassword = formData.get('currentPassword')?.toString() ?? '';
    const newPassword = formData.get('newPassword')?.toString() ?? '';
    const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

    if (newPassword !== confirmPassword) {
        return redirectWithError(context, 'mismatch');
    }
    if (newPassword.length < 12) {
        return redirectWithError(context, 'too_short');
    }
    if (newPassword.length > 128 || currentPassword.length > 128) {
        return redirectWithError(context, 'too_long');
    }

    try {
        const currentIsValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!currentIsValid) {
            return redirectWithError(context, 'invalid_current');
        }

        const passwordIsUnchanged = await verifyPassword(newPassword, user.passwordHash);
        if (passwordIsUnchanged) {
            return redirectWithError(context, 'same_password');
        }

        const passwordHash = await hashPassword(newPassword);

        await db.transaction(async (tx) => {
            await tx
                .update(users)
                .set({ passwordHash, updatedAt: new Date() })
                .where(eq(users.id, user.id));

            await tx
                .delete(sessions)
                .where(and(eq(sessions.userId, user.id), ne(sessions.id, session.id)));
        });

        return context.redirect('/admin/account?status=password_changed', 303);
    } catch (error) {
        console.error('Error changing admin password:', error);
        return redirectWithError(context, 'unavailable');
    }
};
