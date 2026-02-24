import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function fix() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Adding columns to product_supplies...');
        await pool.query(`
            ALTER TABLE product_supplies 
            ADD COLUMN IF NOT EXISTS parts_used DECIMAL(10, 3),
            ADD COLUMN IF NOT EXISTS parts_total DECIMAL(10, 3);
        `);
        console.log('Columns added successfully.');
    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await pool.end();
    }
}

fix();
