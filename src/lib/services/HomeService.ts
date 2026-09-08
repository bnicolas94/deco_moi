import { db } from '../db/connection';
import { homeBlocks } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { sanitizeHomeBlockSettings } from '@/lib/security/homeBlocks';

export interface HomeBlock {
    id: number;
    type: 'hero' | 'categories' | 'featured_products' | 'testimonials' | 'cta' | 'rich_text';
    settings: any;
    order: number;
    isActive: boolean;
}

export async function getHomeBlocks(): Promise<HomeBlock[]> {
    try {
        const blocks = await db.select()
            .from(homeBlocks)
            .where(eq(homeBlocks.isActive, true))
            .orderBy(asc(homeBlocks.order));
        
        return blocks as HomeBlock[];
    } catch (error) {
        console.error('Error fetching home blocks:', error);
        return [];
    }
}

export async function getAllHomeBlocks(): Promise<HomeBlock[]> {
    try {
        const blocks = await db.select()
            .from(homeBlocks)
            .orderBy(asc(homeBlocks.order));
        
        return blocks as HomeBlock[];
    } catch (error) {
        console.error('Error fetching all home blocks:', error);
        return [];
    }
}

export async function updateHomeBlock(id: number, data: Partial<HomeBlock>) {
    let safeData = data;
    if (data.settings !== undefined) {
        const [existing] = await db.select({ type: homeBlocks.type })
            .from(homeBlocks)
            .where(eq(homeBlocks.id, id))
            .limit(1);
        if (!existing) throw new Error('Bloque de inicio inexistente');
        safeData = { ...data, settings: sanitizeHomeBlockSettings(existing.type, data.settings) };
    }
    return await db.update(homeBlocks)
        .set({ ...safeData, updatedAt: new Date() })
        .where(eq(homeBlocks.id, id));
}

export async function createHomeBlock(data: Omit<HomeBlock, 'id'>) {
    return await db.insert(homeBlocks).values({
        ...data,
        settings: sanitizeHomeBlockSettings(data.type, data.settings),
        updatedAt: new Date(),
        createdAt: new Date(),
    });
}

export async function deleteHomeBlock(id: number) {
    return await db.delete(homeBlocks).where(eq(homeBlocks.id, id));
}

export async function reorderBlocks(blockIds: number[]) {
    return await db.transaction(async (tx) => {
        for (let i = 0; i < blockIds.length; i++) {
            await tx.update(homeBlocks)
                .set({ order: i, updatedAt: new Date() })
                .where(eq(homeBlocks.id, blockIds[i]));
        }
    });
}

export async function seedInitialBlocks() {
    const existing = await db.select().from(homeBlocks).limit(1);
    if (existing.length > 0) return;

    const initialBlocks: Omit<HomeBlock, 'id' | 'isActive'>[] = [
        { type: 'hero', order: 0, settings: {} },
        { type: 'categories', order: 1, settings: {} },
        { type: 'featured_products', order: 2, settings: { limit: 8 } },
        { type: 'testimonials', order: 3, settings: {} },
        { type: 'cta', order: 4, settings: {} },
    ];

    for (const block of initialBlocks) {
        await createHomeBlock({
            ...block,
            isActive: true,
        });
    }
}
