import 'dotenv/config';
import { db } from './connection.js';
import { meliPricingConfig } from './schema.js';
import { eq } from 'drizzle-orm';

async function seedMeliConfig() {
    console.log('Seeding Meli config...');
    try {
        const existing = await db.select().from(meliPricingConfig).where(eq(meliPricingConfig.scope, 'global')).limit(1);
        if (existing.length === 0) {
            await db.insert(meliPricingConfig).values({
                scope: 'global',
                scopeLabel: 'Configuración Global por Defecto',
                commissionPct: '13.00',
                fixedCostThreshold1: '15000',
                fixedCostAmount1: '1115',
                fixedCostThreshold2: '25000',
                fixedCostAmount2: '2300',
                fixedCostThreshold3: '33000',
                fixedCostAmount3: '2810',
                extraMarginPct: '0',
                installmentsCostPct: '0',
                roundingStrategy: 'round'
            });
            console.log('Meli global config seeded successfully.');
        } else {
            console.log('Meli global config already exists.');
        }
    } catch (err) {
        console.error('Error seeding Meli config:', err);
    }
}

seedMeliConfig().then(() => process.exit(0));
