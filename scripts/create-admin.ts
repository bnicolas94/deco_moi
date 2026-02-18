import 'dotenv/config';
import { db } from '../src/lib/db/connection';
import { users } from '../src/lib/db/schema';
import { hashPassword } from '../src/lib/auth';
import { eq } from 'drizzle-orm';

async function createAdmin() {
    const email = 'admin@decomoi.com';
    const password = 'admin'; // Cambiar en producción

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        console.log(`El usuario ${email} ya existe.`);
        return;
    }

    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
        email,
        passwordHash: hashedPassword,
        role: 'admin',
        name: 'Administrador',
    });

    console.log(`Usuario administrador creado: ${email} / ${password}`);
    process.exit(0);
}

createAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
