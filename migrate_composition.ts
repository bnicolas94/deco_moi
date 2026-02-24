
import 'dotenv/config';
import { db } from './src/lib/db/connection';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Creating supply_composition table...');
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS supply_composition (
                id SERIAL PRIMARY KEY,
                supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
                parent_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
                yield_ratio DECIMAL(10,3) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Table created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
}

main();
