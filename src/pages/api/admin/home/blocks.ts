import type { APIRoute } from 'astro';
import { getHomeBlocks, getAllHomeBlocks, updateHomeBlock, createHomeBlock, deleteHomeBlock, reorderBlocks } from '@/lib/services/HomeService';

export const GET: APIRoute = async () => {
    try {
        const blocks = await getAllHomeBlocks();
        return new Response(JSON.stringify(blocks), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch blocks' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { action, ...payload } = data;

        switch (action) {
            case 'create':
                await createHomeBlock(payload);
                break;
            case 'update':
                await updateHomeBlock(payload.id, payload.data);
                break;
            case 'delete':
                await deleteHomeBlock(payload.id);
                break;
            case 'reorder':
                await reorderBlocks(payload.blockIds);
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
    }
};
