
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const { Pool } = pg;

async function runMigrations() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }, // Necesario para Railway y produccion en general con SSL
    });

    const db = drizzle(pool);

    console.log('⏳ Running migrations...');

    try {
        // Apunta a la carpeta correcta donde drizzle-kit genera los archivos
        await migrate(db, { migrationsFolder: './drizzle/migrations' });
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
