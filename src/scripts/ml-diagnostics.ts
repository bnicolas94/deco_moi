import 'dotenv/config';
import { db } from '../lib/db/connection';
import { meliCredentials } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function runTest() {
    try {
        console.log("=== 1. Checking Item Ownership ===");
        const itemRes = await fetch('https://api.mercadolibre.com/items/MLA1560654451');
        const itemBody = await itemRes.json();

        if (itemBody.error) {
            console.log("Could not fetch item from API natively:", itemBody);
            return;
        }

        const itemSellerId = itemBody.seller_id;
        console.log(`- Item MLA1560654451 belongs to Seller ID: ${itemSellerId}`);
        console.log(`- Item Title: ${itemBody.title}`);
        console.log(`- Item Status: ${itemBody.status}`);

        console.log("\n=== 2. Checking Active Credentials in DB ===");
        const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true));

        if (creds.length === 0) {
            console.log("No active credentials found in the database. Are you connected?");
            return;
        }

        for (const cred of creds) {
            console.log(`- Credential found! AppID: ${cred.appId} | UserID: ${cred.mlUserId}`);
            if (String(cred.mlUserId) === String(itemSellerId)) {
                console.log("✅ MATCH: The connected user IS the owner of the item.");
            } else {
                console.log("❌ MISMATCH: The connected user IS NOT the owner of the item.");
            }
        }

    } catch (e) {
        console.error(e);
    }
}

runTest();
