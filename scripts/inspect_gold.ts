import { db } from '../src/lib/db/connection';
import { products, productSupplies, supplies, costItems, productCostItems } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const p = await db.query.products.findFirst({ where: eq(products.name, 'Cajita "GOLD"') });
  if (!p) { console.log('not found'); return; }
  console.log('Product:', p.id, p.name);
  
  const ps = await db.select().from(productSupplies).where(eq(productSupplies.productId, p.id));
  console.log('Product Supplies:', ps);
  
  const allSupplies = await db.select().from(supplies);
  for (const s of ps) {
    const supply = allSupplies.find(x => x.id === s.supplyId);
    console.log(`Supply: ${supply?.name}, UnitCost: ${supply?.unitCost}, Qty: ${s.quantity}, PartsUsed: ${s.partsUsed}, PartsTotal: ${s.partsTotal}`);
  }
}
run();
