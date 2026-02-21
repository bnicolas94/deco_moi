import 'dotenv/config';
import { db } from '../lib/db/connection';
import { meliCredentials } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getValidAccessToken } from '../lib/integrations/mercadolibre/auth';

async function listItems() {
    try {
        const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true));
        if (creds.length === 0) return;

        const userId = creds[0].mlUserId;
        const token = await getValidAccessToken();

        console.log(`=== Fetching items for User ID: ${userId} ===`);
        const res = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const body = await res.json();
        if (res.ok) {
            console.log("Total items found for this seller:", body.paging.total);
            console.log("Item IDs directly owned by this account:");
            console.log(body.results);

            if (body.results.includes('MLA1560654451')) {
                console.log("YES! MLA1560654451 IS IN THIS USER'S LIST!");
            } else {
                console.log("NO. MLA1560654451 is NOT in this user's item list.");
            }
        } else {
            console.log("Failed to fetch user items:", body);
        }
    } catch (e) {
        console.error(e);
    }
}

listItems();
