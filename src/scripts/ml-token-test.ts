import 'dotenv/config';
import { db } from '../lib/db/connection';
import { meliCredentials } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getValidAccessToken } from '../lib/integrations/mercadolibre/auth';

async function verifyToken() {
    try {
        console.log("=== Fetching Active Credential ===");
        const creds = await db.select().from(meliCredentials).where(eq(meliCredentials.isActive, true));
        if (creds.length === 0) {
            console.log("No active credentials.");
            return;
        }

        console.log(`User ID in DB: ${creds[0].mlUserId}`);
        console.log(`Access Token: ${creds[0].accessToken.substring(0, 15)}...`);
        console.log(`Refresh Token: ${creds[0].refreshToken?.substring(0, 15)}...`);
        console.log(`Expires At: ${creds[0].expiresAt}`);

        console.log("\n=== Testing Token with /users/me ===");
        const token = await getValidAccessToken();
        const res = await fetch('https://api.mercadolibre.com/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const body = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            console.log(`Logged in as: ${body.nickname} (ID: ${body.id})`);

            // Check item again but WITH token
            console.log("\n=== Checking Item MLA1560654451 WITH token ===");
            const itemRes = await fetch('https://api.mercadolibre.com/items/MLA1560654451', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const itemBody = await itemRes.json();
            console.log(`Item Fetch Status: ${itemRes.status}`);
            if (itemRes.ok) {
                console.log(`Item belongs to Seller: ${itemBody.seller_id}`);
                console.log(`Item status: ${itemBody.status}`);
                if (String(itemBody.seller_id) === String(body.id)) {
                    console.log("MATCH! The item belongs to this logged-in account.");
                } else {
                    console.log("MISMATCH! The item belongs to a DIFFERENT seller account.");
                }
            } else {
                console.log("Failed to fetch item:", itemBody);
            }
        } else {
            console.log("Failed to fetch /users/me. Token might be invalid or App lacks scopes:");
            console.log(body);
        }

    } catch (e) {
        console.error(e);
    }
}

verifyToken();
