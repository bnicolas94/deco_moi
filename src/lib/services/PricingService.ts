import { db } from '../db/connection';
import { products, costItems, productCostItems, productSupplies, supplies } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { MeliService } from './MeliService';

export interface CostBreakdown {
    totalFixed: number;
    totalPerc: number;
    supplyCosts: number;
}

export class PricingService {
    /**
     * Calculates the total fixed and percentage costs for a product,
     * including aggregated supply costs.
     */
    static async getProductCostBreakdown(productId: number): Promise<CostBreakdown> {
        // 1. Fetch product specific costs
        const pCosts = await db.select({
            name: costItems.name,
            type: costItems.type,
            value: costItems.value,
            isActive: costItems.isActive
        }).from(productCostItems)
            .innerJoin(costItems, eq(productCostItems.costItemId, costItems.id))
            .where(eq(productCostItems.productId, productId));

        // 2. Global active costs
        const gCosts = await db.select().from(costItems).where(
            and(eq(costItems.isActive, true), eq(costItems.isGlobal, true))
        );

        // Merge: product specific + global
        let allCosts = [...pCosts.filter(c => c.isActive).map(c => ({ name: c.name, type: c.type, value: Number(c.value) }))];
        gCosts.forEach(gc => {
            if (!allCosts.some(p => p.name === gc.name)) {
                allCosts.push({ name: gc.name, type: gc.type, value: Number(gc.value) });
            }
        });

        // 3. Fetch supplies
        const pSupplies = await db.select({
            quantity: productSupplies.quantity,
            partsUsed: productSupplies.partsUsed,
            partsTotal: productSupplies.partsTotal,
            unitCost: supplies.unitCost
        }).from(productSupplies)
            .innerJoin(supplies, eq(productSupplies.supplyId, supplies.id))
            .where(eq(productSupplies.productId, productId));

        const supplyCosts = pSupplies.reduce((acc, s) => {
            let qty = parseFloat(s.quantity.toString());
            if (s.partsUsed && s.partsTotal) {
                qty = parseFloat(s.partsUsed.toString()) / parseFloat(s.partsTotal.toString());
            }
            return acc + (qty * Number(s.unitCost));
        }, 0);

        let totalFixed = supplyCosts;
        let totalPerc = 0;

        allCosts.forEach(c => {
            if (c.type === 'percentage') {
                totalPerc += c.value;
            } else {
                totalFixed += c.value;
            }
        });

        return {
            totalFixed: Math.round(totalFixed * 100) / 100,
            totalPerc: Math.round(totalPerc * 100) / 100,
            supplyCosts: Math.round(supplyCosts * 100) / 100
        };
    }

    /**
     * Recalculates product prices when a supply's unit cost changes.
     * Formula to maintain net profit (margin):
     * NewGross = (DesiredNet + NewTotalFixed) / (1 - (TotalPerc / 100))
     * 
     * Since DesiredNet is implicit (calculated from oldGross - oldCosts),
     * the change in Gross relates to change in Fixed costs:
     * DeltaGross = DeltaFixed / (1 - (TotalPerc / 100))
     */
    static async recalculateProductPricesForSupplyChange(supplyId: number, oldUnitCost: number, newUnitCost: number) {
        const delta = newUnitCost - oldUnitCost;
        if (delta === 0) return;

        // Find all products using this supply
        const affectedLinks = await db.select({
            productId: productSupplies.productId,
            quantity: productSupplies.quantity,
            partsUsed: productSupplies.partsUsed,
            partsTotal: productSupplies.partsTotal
        }).from(productSupplies)
            .where(eq(productSupplies.supplyId, supplyId));

        for (const link of affectedLinks) {
            const product = await db.query.products.findFirst({
                where: eq(products.id, link.productId)
            });

            if (!product) continue;

            const breakdown = await this.getProductCostBreakdown(product.id);

            let qty = parseFloat(link.quantity.toString());
            if (link.partsUsed && link.partsTotal) {
                qty = parseFloat(link.partsUsed.toString()) / parseFloat(link.partsTotal.toString());
            }

            const deltaFixed = delta * qty;
            const divisor = 1 - (breakdown.totalPerc / 100);

            if (divisor <= 0) continue; // Safety check

            const deltaGross = deltaFixed / divisor;
            const newBasePrice = (parseFloat(product.basePrice.toString()) + deltaGross).toFixed(2);

            // Update product
            await db.update(products)
                .set({
                    basePrice: newBasePrice,
                    updatedAt: new Date()
                })
                .where(eq(products.id, product.id));

            console.log(`Updated Product ${product.id} price from ${product.basePrice} to ${newBasePrice} (delta: ${deltaGross})`);
        }
    }
}
