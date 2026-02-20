import { db } from '../src/lib/db/connection';
import { siteConfig } from '../src/lib/db/schema';

async function main() {
    await db.insert(siteConfig).values({
        key: 'maintenance_mode',
        value: true,
        description: 'Activa o desactiva el modo mantenimiento del sitio'
    }).onConflictDoUpdate({ target: siteConfig.key, set: { value: true } });
    console.log('Maintenance mode inserted successfully into site_config.');
    process.exit(0);
}
main().catch(console.error);
