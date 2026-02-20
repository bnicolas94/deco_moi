import { db } from '../src/lib/db/connection';
import { siteConfig } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const result = await db.select().from(siteConfig).where(eq(siteConfig.key, 'maintenance_mode'));
    console.log('Result from DB:', result);
    process.exit(0);
}
main().catch(console.error);
