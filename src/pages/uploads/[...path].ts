import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export const GET: APIRoute = async ({ params }) => {
    const { path } = params;
    if (!path) return new Response(null, { status: 404 });

    // Ensure we are only serving from the uploads directory
    // path might be "products/filename.jpg" or "categories/filename.jpg"
    const filePath = join(process.cwd(), 'uploads', path);

    if (!existsSync(filePath)) {
        // Fallback to public/uploads just in case some files were already there
        const fallbackPath = join(process.cwd(), 'public', 'uploads', path);
        if (!existsSync(fallbackPath)) {
            return new Response('File not found', { status: 404 });
        }
        
        try {
            const data = await readFile(fallbackPath);
            return serveFile(data, path);
        } catch (e) {
            return new Response('Error reading file', { status: 500 });
        }
    }

    try {
        const data = await readFile(filePath);
        return serveFile(data, path);
    } catch (e) {
        return new Response('Error reading file', { status: 500 });
    }
};

function serveFile(data: Buffer, path: string) {
    const ext = path.split('.').pop()?.toLowerCase();
    
    const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'gif': 'image/gif'
    };

    return new Response(data, {
        headers: {
            'Content-Type': contentTypes[ext || ''] || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}
