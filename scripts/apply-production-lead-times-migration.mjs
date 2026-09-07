import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const envPath = new URL('../.env', import.meta.url);
if (fs.existsSync(envPath)) loadEnv({ path: envPath, override: false, quiet: true });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está definida en .env');

const migrationPath = new URL('../drizzle/migrations/0008_numeric_production_lead_times.sql', import.meta.url);
const sql = fs.readFileSync(migrationPath, 'utf8');
const forbidden = [/\bDROP\b/i, /\bDELETE\s+FROM\b/i, /\bTRUNCATE\b/i];
for (const pattern of forbidden) {
    if (pattern.test(sql)) throw new Error(`Migración rechazada por contener una operación destructiva: ${pattern}`);
}

const protectedTables = ['products', 'production_time_rules', 'orders', 'order_items'];
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function counts() {
    const result = {};
    for (const table of protectedTables) {
        const response = await client.query(`SELECT COUNT(*)::bigint AS count FROM "${table}"`);
        result[table] = Number(response.rows[0].count);
    }
    return result;
}

try {
    await client.connect();
    const before = await counts();
    await client.query('BEGIN');
    await client.query(sql);
    const after = await counts();

    for (const table of protectedTables) {
        if (before[table] !== after[table]) {
            throw new Error(`Cambió la cantidad de filas de ${table}: ${before[table]} → ${after[table]}`);
        }
    }

    const verification = await client.query(`
        SELECT COUNT(*)::int AS count
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (
            (table_name = 'products' AND column_name IN ('production_min_business_days', 'production_max_business_days'))
            OR (table_name = 'production_time_rules' AND column_name IN ('production_min_business_days', 'production_max_business_days'))
            OR (table_name = 'order_items' AND column_name IN ('production_min_business_days', 'production_max_business_days'))
          )
    `);
    if (verification.rows[0].count !== 6) throw new Error(`Se encontraron ${verification.rows[0].count}/6 columnas esperadas`);

    await client.query('COMMIT');
    console.log('Migración aditiva aplicada correctamente.');
    console.log('Filas preservadas:', before);
    console.log('Columnas verificadas: 6/6.');
} catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Migración revertida:', error.message);
    process.exitCode = 1;
} finally {
    await client.end().catch(() => undefined);
}
