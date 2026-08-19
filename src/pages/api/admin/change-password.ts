import type { APIRoute } from 'astro';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { sessions, users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth';

const redirectWithError = (context: Parameters<APIRoute>[0], error: string) =>
    context.redirect(`/admin/account?error=${error}`, 303);

function isSameOriginRequest(context: Parameters<APIRoute>[0]): boolean {
    const origin = context.request.headers.get('origin');
    const fetchSite = context.request.headers.get('sec-fetch-site');

    // Modern browsers provide both headers. Reject an explicitly cross-site
    // request even if a proxy happens to rewrite Host/URL information.
    if (fetchSite && fetchSite !== 'same-origin') {
        return false;
    }

    if (!origin) {
        return false;
    }

    const allowedOrigins = new Set<string>([context.url.origin]);
    const publicUrl = import.meta.env.PUBLIC_URL || process.env.PUBLIC_URL || 'https://decomoi.com.ar';

    if (publicUrl) {
        try {
            allowedOrigins.add(new URL(publicUrl.replace(/"/g, '')).origin);
        } catch {
            // Ignore a malformed optional URL and continue with request headers.
        }
    }

    try {
        return allowedOrigins.has(new URL(origin).origin);
    } catch {
        return false;
    }
}

export const POST: APIRoute = async (context) => {
    const { user, session } = context.locals;

    if (!user || user.role !== 'admin' || !session || !user.passwordHash) {
        return new Response('No autorizado', { status: 401 });
    }

    if (!isSameOriginRequest(context)) {
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
