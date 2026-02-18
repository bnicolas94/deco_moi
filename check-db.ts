
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres:NQrNZevdzdngPgxNppBIVMzlGzBocxGs@crossover.proxy.rlwy.net:11100/railway";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'mockup_templates';
        `);
        console.log("Columns in mockup_templates:", res.rows);
        client.release();
    } catch (e) {
        console.error("Error checking schema:", e);
    }
    await pool.end();
}

checkSchema();
