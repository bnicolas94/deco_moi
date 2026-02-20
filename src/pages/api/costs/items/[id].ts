import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { costItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const id = parseInt(params.id!);
        const data = await request.json();

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = parseFloat(data.value).toString();
        if (data.isGlobal !== undefined) updateData.isGlobal = data.isGlobal;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        updateData.updatedAt = new Date();

        const updated = await db.update(costItems)
            .set(updateData)
            .where(eq(costItems.id, id))
            .returning();

        return new Response(JSON.stringify(updated[0]), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const id = parseInt(params.id!);
        await db.delete(costItems).where(eq(costItems.id, id));
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
