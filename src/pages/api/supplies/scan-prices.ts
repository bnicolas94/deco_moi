import type { APIRoute } from 'astro';
import { PriceMonitorService } from '@/lib/services/PriceMonitorService';

export const POST: APIRoute = async () => {
    try {
        const results = await PriceMonitorService.scanAllPrices();
        return new Response(JSON.stringify(results), { status: 200 });
    } catch (error: any) {
        console.error('API Scan Prices Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
