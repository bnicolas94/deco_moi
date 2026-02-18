
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres:NQrNZevdzdngPgxNppBIVMzlGzBocxGs@crossover.proxy.rlwy.net:11100/railway";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function testInsert() {
    const client = await pool.connect();
    try {
        console.log("Attempting insert...");

        const query = `
            INSERT INTO "mockup_templates" ("product_id", "name", "slug", "mockup_image_url", "surfaces", "default_transform", "is_active", "perspective_config") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        // Note: I added "perspective_config" with empty object because it is NOT NULL in the DB schema output
        const values = [
            1,
            "Test Mockup",
            "test-mockup-slug-" + Date.now(),
            "http://example.com/image.png",
            JSON.stringify([]),
            JSON.stringify({ scale: 1, rotation: 0 }),
            true,
            JSON.stringify({})
        ];

        const res = await client.query(query, values);
        console.log("Insert successful:", res.rows[0]);

    } catch (e) {
        console.error("Insert failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

testInsert();
