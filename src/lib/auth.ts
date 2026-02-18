import { db } from '@/lib/db/connection';
import { sessions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type Session = typeof sessions.$inferSelect;
export type User = typeof users.$inferSelect;

export async function createSession(userId: string): Promise<Session> {
    const sessionId = randomBytes(32).toString('hex'); // Simple session ID
    const session: Session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
    };
    await db.insert(sessions).values(session);
    return session;
}

export async function validateSessionToken(token: string): Promise<{ session: Session | null; user: User | null }> {
    const [result] = await db
        .select({ user: users, session: sessions })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.id, token));

    if (!result) {
        return { session: null, user: null };
    }

    const { session, user } = result;

    // Check expiry
    if (Date.now() >= session.expiresAt.getTime()) {
        await db.delete(sessions).where(eq(sessions.id, session.id));
        return { session: null, user: null };
    }

    // Extend session if close to expiry (e.g., halfway)
    if (Date.now() >= session.expiresAt.getTime() - SESSION_EXPIRY_MS / 2) {
        session.expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
        await db
            .update(sessions)
            .set({ expiresAt: session.expiresAt })
            .where(eq(sessions.id, session.id));
    }

    return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return timingSafeEqual(keyBuffer, derivedKey);
}
