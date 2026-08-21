import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const ALLOWED_DIRECTORIES = new Set(['products', 'categories', 'mockups']);

export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
};

export function getSafeUploadPath(requestedPath: string): string | null {
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
    return UPLOAD_CONTENT_TYPES[extension] ? segments.join('/') : null;
}

function resolveInside(root: string, relativePath: string): string | null {
    const absoluteRoot = resolve(root);
    const candidate = resolve(absoluteRoot, relativePath);
    const pathFromRoot = relative(absoluteRoot, candidate);
    return pathFromRoot && !pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot) ? candidate : null;
}

export async function readUploadedFile(relativePath: string): Promise<Buffer | null> {
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
