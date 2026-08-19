import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve } from 'node:path';

const ALLOWED_DIRECTORIES = new Set(['products', 'categories', 'mockups']);
const CONTENT_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
};

function getSafeRelativePath(requestedPath: string): string | null {
    if (!requestedPath || requestedPath.length > 500 || /[\u0000-\u001f\\]/.test(requestedPath)) {
        return null;
    }

    let decodedPath: string;
    try {
        decodedPath = decodeURIComponent(requestedPath);
    } catch {
        return null;
    }

    const segments = decodedPath.split('/');
    if (
        decodedPath.startsWith('/')
        || segments.length < 2
        || !ALLOWED_DIRECTORIES.has(segments[0])
        || segments.some((segment) => !segment || segment === '.' || segment === '..')
    ) {
        return null;
    }

    const extension = segments.at(-1)?.split('.').pop()?.toLowerCase() || '';
    return CONTENT_TYPES[extension] ? segments.join('/') : null;
}

function resolveInside(root: string, relativePath: string): string | null {
    const absoluteRoot = resolve(root);
    const candidate = resolve(absoluteRoot, relativePath);
    const pathFromRoot = relative(absoluteRoot, candidate);
    return pathFromRoot && !pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot) ? candidate : null;
}

async function readUploadedFile(relativePath: string): Promise<Buffer | null> {
    const roots = [
        resolve(process.cwd(), 'uploads'),
        resolve(process.cwd(), 'public', 'uploads'),
    ];

    for (const root of roots) {
        const candidate = resolveInside(root, relativePath);
        if (!candidate) continue;
        try {
            return await readFile(candidate);
        } catch (error: any) {
            if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') {
                console.error('Error leyendo archivo subido:', error);
                throw error;
            }
        }
    }

    return null;
}

export const GET: APIRoute = async ({ params }) => {
    const relativePath = getSafeRelativePath(params.path || '');
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
                'Content-Type': CONTENT_TYPES[extension],
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
