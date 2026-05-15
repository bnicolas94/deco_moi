import { db } from './src/lib/db/connection';
import { products } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const res = await db.select().from(products).where(eq(products.slug, 'cajita-de-chocolates-gold-2')).limit(1);
        if (res[0]) {
            console.log('RAW CONTENT:');
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
