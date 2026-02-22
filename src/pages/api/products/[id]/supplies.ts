import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { productSupplies, supplies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const GET: APIRoute = async ({ params }) => {
    try {
        const productId = parseInt(params.id!);
        if (isNaN(productId)) return new Response(JSON.stringify({ error: 'Invalid Product ID' }), { status: 400 });

        const data = await db.select({
            id: productSupplies.id,
            supplyId: productSupplies.supplyId,
            quantity: productSupplies.quantity,
            partsUsed: productSupplies.partsUsed,
            partsTotal: productSupplies.partsTotal,
            name: supplies.name,
            unit: supplies.unit,
            unitCost: supplies.unitCost,
            category: supplies.category,
        })
            .from(productSupplies)
            .innerJoin(supplies, eq(productSupplies.supplyId, supplies.id))
            .where(eq(productSupplies.productId, productId));

        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error: any) {
        console.error('API Product Supplies GET Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

const syncSchema = z.object({
    supplies: z.array(z.object({
        supplyId: z.number(),
        quantity: z.number().min(0),
        partsUsed: z.number().nullable().optional(),
        partsTotal: z.number().nullable().optional()
    }))
});

export const POST: APIRoute = async ({ request, params }) => {
    try {
        const productId = parseInt(params.id!);
        if (isNaN(productId)) return new Response(JSON.stringify({ error: 'Invalid Product ID' }), { status: 400 });

        const body = await request.json();
        const { supplies: suppliesData } = syncSchema.parse(body);

        // Transaction to ensure atomicity
        await db.transaction(async (tx) => {
            // 1. Delete existing links
            await tx.delete(productSupplies).where(eq(productSupplies.productId, productId));

            // 2. Insert new links if any
            if (suppliesData.length > 0) {
                await tx.insert(productSupplies).values(
                    suppliesData.map(s => ({
                        productId,
                        supplyId: s.supplyId,
                        quantity: s.quantity.toString(),
                        partsUsed: s.partsUsed?.toString(),
                        partsTotal: s.partsTotal?.toString()
                    }))
                );
            }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        console.error('API Product Supplies POST Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Server error' }), { status: 500 });
    }
}
