import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { productVariants, variantGroups, variantGroupOptions } from '../src/lib/db/schema.js';

dotenv.config();

const { Pool } = pg;

async function migrateVariants() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const db = drizzle(pool);

    try {
        console.log('Fetching old variants...');
        const oldVariants = await db.select().from(productVariants);
        
        console.log('Found ' + oldVariants.length + ' old variants.');
        
        if (oldVariants.length === 0) {
            console.log('No variants to migrate.');
            process.exit(0);
        }

        const byProduct: any = {};
        for (const v of oldVariants) {
            if (!byProduct[v.productId]) {
                byProduct[v.productId] = [];
            }
            byProduct[v.productId].push(v);
        }

        console.log('Migrating for ' + Object.keys(byProduct).length + ' products...');

        await db.transaction(async (tx) => {
            for (const productIdStr of Object.keys(byProduct)) {
                const productId = parseInt(productIdStr);
                const variants = byProduct[productId];

                const existingGroups = await tx.select().from(variantGroups).where(eq(variantGroups.productId, productId));
                if (existingGroups.length > 0) {
                    console.log('Product ' + productId + ' already has variant groups. Skipping.');
                    continue;
                }

                const [newGroup] = await tx.insert(variantGroups).values({
                    productId,
                    name: 'Opciones',
                    displayOrder: 0,
                    isRequired: true
                }).returning({ id: variantGroups.id });

                for (let i = 0; i < variants.length; i++) {
                    const v = variants[i];
                    await tx.insert(variantGroupOptions).values({
                        groupId: newGroup.id,
                        name: v.name,
                        sku: v.sku,
                        priceModifier: v.price ? v.price.toString() : '0',
                        stock: v.stock || 0,
                        images: v.images || [],
                        displayOrder: i,
                        isActive: v.isActive !== false
                    });
                }
                
                console.log('Migrated ' + variants.length + ' variants for product ' + productId + '.');
            }
        });

        console.log('Migration completed successfully!');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrateVariants();
