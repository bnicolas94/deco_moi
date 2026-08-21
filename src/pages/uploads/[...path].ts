import type { APIRoute } from 'astro';
import { basename } from 'node:path';
import {
    getSafeUploadPath,
    readUploadedFile,
    UPLOAD_CONTENT_TYPES,
} from '@/lib/security/uploadFiles';

export const GET: APIRoute = async ({ params }) => {
    const relativePath = getSafeUploadPath(params.path || '');
    if (!relativePath) {
        return new Response('File not found', { status: 404 });
    }

    try {
        const data = await readUploadedFile(relativePath);
        if (!data) {
            return new Response('File not found', { status: 404 });
        }

        const extension = relativePath.split('.').pop()!.toLowerCase();
        const fileName = basename(relativePath).replace(/[^a-z0-9._-]/gi, '_');
        return new Response(new Uint8Array(data), {
            headers: {
                'Content-Type': UPLOAD_CONTENT_TYPES[extension],
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Security-Policy': "default-src 'none'; sandbox",
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch {
        return new Response('Error reading file', { status: 500 });
    }
};
