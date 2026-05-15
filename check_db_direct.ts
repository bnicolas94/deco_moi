import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

const { Pool } = pg;
const pool = new Pool({
    connectionString: "postgresql://postgres:NQrNZevdzdngPgxNppBIVMzlGzBocxGs@crossover.proxy.rlwy.net:11100/railway",
    ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

async function check() {
    try {
        const res = await db.select().from(schema.products).where(eq(schema.products.slug, 'cajita-de-chocolates-gold-2')).limit(1);
        if (res[0]) {
            console.log('RAW JSON:');
            console.log(JSON.stringify(res[0].shortDescription));
        } else {
            console.log('Product not found');
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
