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
  new URL('../drizzle/migrations/0006_cost_configuration_history.sql', import.meta.url),
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

const tablesToProtect = [
  'orders',
  'order_items',
  'cost_items',
  'order_item_costs',
  'meli_orders',
  'meli_pricing_config',
  'supplies',
  'product_cost_items',
  'product_supplies',
];
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

  const historyVerification = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('cost_history_metadata', 'cost_configuration_history')) AS tables,
      (SELECT COUNT(*)::int FROM pg_trigger
       WHERE NOT tgisinternal
         AND tgname IN (
           'cost_items_history_trigger',
           'supplies_history_trigger',
           'product_cost_items_history_trigger',
           'product_supplies_history_trigger'
         )) AS triggers
  `);
  if (historyVerification.rows[0].tables !== 2 || historyVerification.rows[0].triggers !== 4) {
    throw new Error(`Historial de costos incompleto: ${historyVerification.rows[0].tables}/2 tablas y ${historyVerification.rows[0].triggers}/4 triggers.`);
  }
  const openHistory = await client.query(`
    SELECT COUNT(*)::int AS count
    FROM cost_configuration_history
    WHERE valid_to IS NULL
  `);
  const expectedOpenHistory = before.cost_items
    + before.supplies
    + before.product_cost_items
    + before.product_supplies;
  if (openHistory.rows[0].count !== expectedOpenHistory) {
    throw new Error(`Backfill histórico incompleto: ${openHistory.rows[0].count}/${expectedOpenHistory} versiones abiertas.`);
  }

  await client.query('COMMIT');
  console.log('Migración aplicada correctamente dentro de una transacción.');
  console.log('Conteos preservados:', before);
  console.log('Columnas verificadas: 13/13.');
  console.log('Historial de costos verificado: 2 tablas y 4 triggers.');
  console.log(`Versiones históricas abiertas: ${openHistory.rows[0].count}/${expectedOpenHistory}.`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  console.error('Migración revertida:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
