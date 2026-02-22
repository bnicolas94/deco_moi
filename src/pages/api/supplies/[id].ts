import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { supplies, supplyComposition } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const id = parseInt(params.id!);
        if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 });

        const data = await request.json();

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.unitCost !== undefined) updateData.unitCost = parseFloat(data.unitCost).toString();
        if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
        if (data.supplier !== undefined) updateData.supplier = data.supplier;
        if (data.link !== undefined) updateData.link = data.link;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.packPrice !== undefined) updateData.packPrice = data.packPrice ? parseFloat(data.packPrice).toString() : null;
        if (data.packQuantity !== undefined) updateData.packQuantity = data.packQuantity ? parseFloat(data.packQuantity).toString() : null;
        if (data.parentId !== undefined) updateData.parentId = data.parentId ? parseInt(data.parentId) : null;
        if (data.yieldRatio !== undefined) updateData.yieldRatio = data.yieldRatio ? parseFloat(data.yieldRatio).toString() : null;
        updateData.updatedAt = new Date();

        const updated = await db.update(supplies)
            .set(updateData)
            .where(eq(supplies.id, id))
            .returning();

        if (updated.length === 0) {
            return new Response(JSON.stringify({ error: 'Supply not found' }), { status: 404 });
        }

        const mainSupply = updated[0];
        let allUpdated = new Map<number, any>();
        allUpdated.set(mainSupply.id, mainSupply);

        // Update components if provided
        if (data.components !== undefined) {
            await db.delete(supplyComposition).where(eq(supplyComposition.supplyId, id));
            if (data.components.length > 0) {
                await db.insert(supplyComposition).values(
                    data.components.map((c: any) => ({
                        supplyId: id,
                        parentId: parseInt(c.parentId),
                        yieldRatio: parseFloat(c.yieldRatio).toString()
                    }))
                );

                // Update legacy fields for compatibility (first component)
                const first = data.components[0];
                await db.update(supplies)
                    .set({
                        parentId: parseInt(first.parentId),
                        yieldRatio: parseFloat(first.yieldRatio).toString()
                    })
                    .where(eq(supplies.id, id));
            } else {
                // Clear legacy fields
                await db.update(supplies)
                    .set({ parentId: null, yieldRatio: null })
                    .where(eq(supplies.id, id));
            }
        }

        // Recursive cascading logic
        async function updateDescendants(parentId: number) {
            // Find children that have this supply as a component
            const childLinks = await db.select().from(supplyComposition).where(eq(supplyComposition.parentId, parentId));

            for (const link of childLinks) {
                const childId = link.supplyId;

                // Recalculate child cost based on ALL its components
                const childComponents = await db.select().from(supplyComposition).where(eq(supplyComposition.supplyId, childId));
                let totalCost = 0;

                for (const comp of childComponents) {
                    const p = await db.select().from(supplies).where(eq(supplies.id, comp.parentId)).limit(1);
                    if (p.length > 0) {
                        const pCost = parseFloat(p[0].unitCost || '0');
                        const yRatio = parseFloat(comp.yieldRatio || '1');
                        totalCost += pCost / yRatio;
                    }
                }

                // Update child record
                const updatedChild = await db.update(supplies)
                    .set({ unitCost: totalCost.toFixed(2), updatedAt: new Date() })
                    .where(eq(supplies.id, childId))
                    .returning();

                if (updatedChild.length > 0) {
                    allUpdated.set(childId, updatedChild[0]);
                    // Recursively update descendants of this child
                    await updateDescendants(childId);
                }
            }

            // Also check for legacy single-parent relationship
            const legacyChildren = await db.select().from(supplies).where(eq(supplies.parentId, parentId));
            for (const child of legacyChildren) {
                if (allUpdated.has(child.id)) continue;

                const p = await db.select().from(supplies).where(eq(supplies.id, parentId)).limit(1);
                if (p.length > 0) {
                    const pCost = parseFloat(p[0].unitCost || '0');
                    const yRatio = parseFloat(child.yieldRatio || '1');
                    const newCost = (pCost / yRatio).toFixed(2);

                    const up = await db.update(supplies)
                        .set({ unitCost: newCost, updatedAt: new Date() })
                        .where(eq(supplies.id, child.id))
                        .returning();

                    if (up.length > 0) {
                        allUpdated.set(child.id, up[0]);
                        await updateDescendants(child.id);
                    }
                }
            }
        }

        // Trigger cascade if cost or components changed
        if (data.unitCost !== undefined || data.components !== undefined) {
            await updateDescendants(id);
        }

        // Final step: ensure ALL objects in allUpdated have their current components
        const finalResults = await Promise.all(Array.from(allUpdated.values()).map(async (item) => {
            const comps = await db.select({
                parentId: supplyComposition.parentId,
                yieldRatio: supplyComposition.yieldRatio
            })
                .from(supplyComposition)
                .where(eq(supplyComposition.supplyId, item.id));

            return { ...item, components: comps };
        }));

        return new Response(JSON.stringify(finalResults), { status: 200 });
    } catch (error: any) {
        console.error('API Supplies PUT Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Server error' }), { status: 500 });
    }
}

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const id = parseInt(params.id!);
        if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 });

        const deleted = await db.delete(supplies)
            .where(eq(supplies.id, id))
            .returning();

        if (deleted.length === 0) {
            return new Response(JSON.stringify({ error: 'Supply not found' }), { status: 404 });
        }

        return new Response(null, { status: 204 });
    } catch (error: any) {
        console.error('API Supplies DELETE Error:', error);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
