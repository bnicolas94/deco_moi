import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { basename, extname } from 'node:path';
import { getSafeUploadPath, readUploadedFile } from '@/lib/security/uploadFiles';

const ALLOWED_WIDTHS = new Set([160, 320, 480, 640, 960, 1280, 1600]);
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_CACHE_ENTRIES = 64;
const optimizedImageCache = new Map<string, Promise<Buffer | null>>();

function getRequestedWidth(request: Request): number | null {
    const rawWidth = new URL(request.url).searchParams.get('w');
    if (!rawWidth || !/^\d{2,4}$/.test(rawWidth)) return null;

    const width = Number(rawWidth);
    return ALLOWED_WIDTHS.has(width) ? width : null;
}

async function getOptimizedImage(relativePath: string, width: number): Promise<Buffer | null> {
    const cacheKey = `${relativePath}:${width}`;
    const cached = optimizedImageCache.get(cacheKey);
    if (cached) {
        optimizedImageCache.delete(cacheKey);
        optimizedImageCache.set(cacheKey, cached);
        return cached;
    }

    const processing = (async () => {
        const source = await readUploadedFile(relativePath);
        if (!source) return null;

        return sharp(source, {
            failOn: 'error',
            limitInputPixels: MAX_INPUT_PIXELS,
        })
            .rotate()
            .resize({ width, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, alphaQuality: 85, effort: 4, smartSubsample: true })
            .toBuffer();
    })();

    optimizedImageCache.set(cacheKey, processing);
    if (optimizedImageCache.size > MAX_CACHE_ENTRIES) {
        const oldestKey = optimizedImageCache.keys().next().value;
        if (oldestKey) optimizedImageCache.delete(oldestKey);
    }

    try {
        return await processing;
    } catch (error) {
        optimizedImageCache.delete(cacheKey);
        throw error;
    }
}

export const GET: APIRoute = async ({ params, request }) => {
    const relativePath = getSafeUploadPath(params.path || '');
    const width = getRequestedWidth(request);
    if (!relativePath || !width) {
        return new Response('Image not found', { status: 404 });
    }

    // Las animaciones se sirven por su URL original para no perder cuadros.
    if (extname(relativePath).toLowerCase() === '.gif') {
        return Response.redirect(new URL(`/uploads/${relativePath}`, request.url), 302);
    }

    try {
        const optimized = await getOptimizedImage(relativePath, width);
        if (!optimized) return new Response('Image not found', { status: 404 });

        const fileName = basename(relativePath, extname(relativePath)).replace(/[^a-z0-9_-]/gi, '_');
        return new Response(new Uint8Array(optimized), {
            headers: {
                'Content-Type': 'image/webp',
                'Content-Disposition': `inline; filename="${fileName}-${width}.webp"`,
                'Content-Length': String(optimized.byteLength),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Security-Policy': "default-src 'none'; sandbox",
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Error optimizando imagen:', error);
        return new Response('Error processing image', { status: 422 });
    }
};
