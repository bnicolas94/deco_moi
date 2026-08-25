import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const envCandidates = [
  new URL('../.env', import.meta.url),
  new URL('../.env.example', import.meta.url),
];
const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

if (envPath) {
  loadEnv({ path: envPath, override: false, quiet: true });
}

const migrationPaths = [
  new URL('../drizzle/migrations/0004_meli_profitability.sql', import.meta.url),
  new URL('../drizzle/migrations/0005_meli_financial_model.sql', import.meta.url),
];
const sql = migrationPaths.map((migrationPath) => fs.readFileSync(migrationPath, 'utf8')).join('\n');

const forbiddenStatements = [
  /\bDROP\s+(TABLE|COLUMN|SCHEMA|DATABASE)\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bTRUNCATE\b/i,
];

for (const pattern of forbiddenStatements) {
  if (pattern.test(sql)) {
    throw new Error(`Migración rechazada por contener una operación destructiva: ${pattern}`);
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en .env ni en .env.example');
}

const tablesToProtect = ['orders', 'order_items', 'cost_items', 'order_item_costs', 'meli_orders', 'meli_pricing_config'];
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function tableExists(tableName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function getProtectedCounts() {
  const counts = {};
  for (const tableName of tablesToProtect) {
    if (!(await tableExists(tableName))) {
      throw new Error(`Falta la tabla requerida ${tableName}; no se aplicó ningún cambio.`);
    }
    const result = await client.query(`SELECT COUNT(*)::bigint AS count FROM "${tableName}"`);
    counts[tableName] = Number(result.rows[0].count);
  }
  return counts;
}

try {
  await client.connect();
  const before = await getProtectedCounts();

  await client.query('BEGIN');
  await client.query(sql);

  const after = await getProtectedCounts();
  for (const tableName of tablesToProtect) {
    if (before[tableName] !== after[tableName]) {
      throw new Error(`Cambió la cantidad de filas de ${tableName}: ${before[tableName]} → ${after[tableName]}`);
    }
  }

  const verification = await client.query(`
    SELECT COUNT(*)::int AS count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'orders' AND column_name IN ('sales_channel', 'external_order_id', 'financial_status'))
        OR (table_name = 'order_items' AND column_name IN ('internal_units', 'net_revenue', 'pack_quantity'))
        OR (table_name = 'order_item_costs' AND column_name IN ('cost_code', 'category', 'affects_profit'))
        OR (table_name = 'meli_orders' AND column_name IN ('mapping_status', 'financial_status', 'taxes_amount', 'shipping_seller_cost'))
      )
  `);
  if (verification.rows[0].count !== 13) {
    throw new Error(`La verificación del esquema encontró ${verification.rows[0].count}/13 columnas esperadas.`);
  }

  await client.query('COMMIT');
  console.log('Migración aplicada correctamente dentro de una transacción.');
  console.log('Conteos preservados:', before);
  console.log('Columnas verificadas: 13/13.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  console.error('Migración revertida:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
