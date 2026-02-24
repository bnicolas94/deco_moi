import { db } from './src/lib/db/connection';
import { supplyCategories } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

const INITIAL_CATEGORIES = [
    { slug: 'chocolates', name: 'Chocolates', icon: '🍫', order: 1 },
    { slug: 'hojas', name: 'Hojas / Papeles', icon: '📄', order: 2 },
    { slug: 'velas', name: 'Velas', icon: '🕯️', order: 3 },
    { slug: 'cajas', name: 'Cajas', icon: '📦', order: 4 },
    { slug: 'extras', name: 'Extras', icon: '✨', order: 5 },
    { slug: 'tejidos', name: 'Tejidos', icon: '🧵', order: 6 },
];

async function seed() {
    console.log('🌱 Seeding supply categories...');
    for (const cat of INITIAL_CATEGORIES) {
        const existing = await db.select().from(supplyCategories).where(eq(supplyCategories.slug, cat.slug));
        if (existing.length === 0) {
            await db.insert(supplyCategories).values(cat);
            console.log(`✅ Added category: ${cat.name}`);
        } else {
            console.log(`⏩ Category ${cat.name} already exists`);
        }
    }
    console.log('✨ Seed complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
