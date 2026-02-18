
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres:NQrNZevdzdngPgxNppBIVMzlGzBocxGs@crossover.proxy.rlwy.net:11100/railway";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting migration...");

        // 1. Rename base_image_url -> mockup_image_url
        // Check if exists first to avoid error if re-run
        await client.query(`
            DO $$
            BEGIN
              IF EXISTS(SELECT *
                FROM information_schema.columns
                WHERE table_name='mockup_templates' and column_name='base_image_url')
              THEN
                  ALTER TABLE mockup_templates RENAME COLUMN base_image_url TO mockup_image_url;
              END IF;
            END $$;
        `);
        console.log("Renamed base_image_url");

        // 2. Add surfaces column
        await client.query(`
            ALTER TABLE mockup_templates 
            ADD COLUMN IF NOT EXISTS surfaces json DEFAULT '[]'::json;
        `);
        console.log("Added surfaces");

        // 3. Add default_transform column
        await client.query(`
            ALTER TABLE mockup_templates 
            ADD COLUMN IF NOT EXISTS default_transform json DEFAULT '{"scale":1,"rotation":0}'::json;
        `);
        console.log("Added default_transform");

        // 4. Add metadata column
        await client.query(`
            ALTER TABLE mockup_templates 
            ADD COLUMN IF NOT EXISTS metadata json;
        `);
        console.log("Added metadata");

        console.log("Migration completed successfully.");
    } catch (e) {
        console.error("Error executing migration:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
