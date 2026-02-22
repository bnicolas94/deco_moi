import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { supplies, supplyComposition } from '@/lib/db/schema';
import { z } from 'zod';
import { eq, and, ilike, or, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
    try {
        const category = url.searchParams.get('category');
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');

        let conditions = [];

        if (category && category !== 'all') {
            conditions.push(eq(supplies.category, category));
        }

        if (status === 'active') {
            conditions.push(eq(supplies.isActive, true));
        } else if (status === 'inactive') {
            conditions.push(eq(supplies.isActive, false));
        }

        if (search) {
            conditions.push(or(
                ilike(supplies.name, `%${search}%`),
                ilike(supplies.supplier, `%${search}%`)
            ));
        }

        const query = db.select().from(supplies);

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        const data = await query.orderBy(supplies.name);

        // Fetch composition for all supplies in one go or per supply
        const suppliesWithComponents = await Promise.all(data.map(async (s) => {
            const components = await db.select({
                parentId: supplyComposition.parentId,
                yieldRatio: supplyComposition.yieldRatio
            })
                .from(supplyComposition)
                .where(eq(supplyComposition.supplyId, s.id));

            return { ...s, components };
        }));

        return new Response(JSON.stringify(suppliesWithComponents), { status: 200 });
    } catch (error: any) {
        console.error('API Supplies GET Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

const componentSchema = z.object({
    parentId: z.number(),
    yieldRatio: z.number().min(0.0001)
});

const supplySchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    unit: z.string().min(1),
    unitCost: z.number().min(0),
    stock: z.number().optional().default(0),
    supplier: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    // Phase 11 fields
    packPrice: z.number().optional().nullable(),
    packQuantity: z.number().optional().nullable(),
    parentId: z.number().optional().nullable(),
    yieldRatio: z.number().optional().nullable(),
    minStock: z.number().optional().default(20),
    // Phase 15
    components: z.array(componentSchema).optional()
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const parsed = supplySchema.parse({
            ...data,
            unitCost: parseFloat(data.unitCost),
            stock: parseInt(data.stock) || 0,
            minStock: data.minStock ? parseInt(data.minStock) : 20,
            packPrice: data.packPrice ? parseFloat(data.packPrice) : null,
            packQuantity: data.packQuantity ? parseFloat(data.packQuantity) : null,
            parentId: data.parentId ? parseInt(data.parentId) : null,
            yieldRatio: data.yieldRatio ? parseFloat(data.yieldRatio) : null,
            components: data.components ? data.components.map((c: any) => ({
                parentId: parseInt(c.parentId),
                yieldRatio: parseFloat(c.yieldRatio)
            })) : []
        });

        const newSupplyRaw = await db.insert(supplies).values({
            name: parsed.name,
            category: parsed.category,
            unit: parsed.unit,
            unitCost: parsed.unitCost.toString(),
            stock: parsed.stock,
            minStock: parsed.minStock,
            supplier: parsed.supplier,
            link: parsed.link,
            notes: parsed.notes,
            isActive: parsed.isActive,
            packPrice: parsed.packPrice?.toString(),
            packQuantity: parsed.packQuantity?.toString(),
            parentId: parsed.components && parsed.components.length > 0 ? parsed.components[0].parentId : parsed.parentId,
            yieldRatio: parsed.components && parsed.components.length > 0 ? parsed.components[0].yieldRatio.toString() : parsed.yieldRatio?.toString()
        }).returning();

        const newSupply = newSupplyRaw[0];

        // Insert components if any
        if (parsed.components && parsed.components.length > 0) {
            await db.insert(supplyComposition).values(
                parsed.components.map(c => ({
                    supplyId: newSupply.id,
                    parentId: c.parentId,
                    yieldRatio: c.yieldRatio.toString()
                }))
            );
        }

        return new Response(JSON.stringify({ ...newSupply, components: parsed.components || [] }), { status: 201 });
    } catch (error: any) {
        console.error('API Supplies POST Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Invalid data' }), { status: 400 });
    }
}
