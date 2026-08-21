import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MULTIPART_BYTES = 50 * 1024 * 1024;
const MAX_FILES_PER_FIELD = 20;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_DIMENSION = 2000;

const IMAGE_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
} as const;

type AllowedImageMime = keyof typeof IMAGE_TYPES;
type UploadDirectory = 'products' | 'categories' | 'mockups';
type PreparedImage = { bytes: Uint8Array; extension: string };

export class ImageUploadError extends Error {
    public readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
        this.name = 'ImageUploadError';
    }
}

export function assertMultipartRequest(request: Request): void {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
        throw new ImageUploadError('La solicitud debe enviarse como formulario', 415);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
        throw new ImageUploadError('La solicitud es demasiado grande', 413);
    }
}

function hasExpectedSignature(buffer: Uint8Array, mime: AllowedImageMime): boolean {
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mime === 'image/png') {
        const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
        return buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte);
    }
    if (mime === 'image/webp') {
        return buffer.length >= 12
            && String.fromCharCode(...buffer.slice(0, 4)) === 'RIFF'
            && String.fromCharCode(...buffer.slice(8, 12)) === 'WEBP';
    }
    return false;
}

async function prepareImage(file: File): Promise<PreparedImage> {
    if (!(file instanceof File) || !file.name || file.size <= 0) {
        throw new ImageUploadError('El archivo de imagen está vacío');
    }
    if (file.size > MAX_IMAGE_BYTES) {
        throw new ImageUploadError('Cada imagen debe pesar como máximo 8 MB', 413);
    }

    const mime = file.type.toLowerCase() as AllowedImageMime;
    const extension = IMAGE_TYPES[mime];
    if (!extension) {
        throw new ImageUploadError('Formato de imagen no permitido. Usá JPG, PNG o WEBP.');
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedSignature(bytes, mime)) {
        throw new ImageUploadError('El contenido del archivo no coincide con una imagen válida');
    }

    try {
        const image = sharp(bytes, {
            failOn: 'error',
            limitInputPixels: MAX_IMAGE_PIXELS,
        });
        const metadata = await image.metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error('Dimensiones de imagen inválidas');
        }

        // Normalizar orientación, quitar metadatos y guardar un archivo liviano.
        const optimized = await image
            .rotate()
            .resize({
                width: MAX_IMAGE_DIMENSION,
                height: MAX_IMAGE_DIMENSION,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 82, alphaQuality: 85, effort: 4, smartSubsample: true })
            .toBuffer();

        return { bytes: new Uint8Array(optimized), extension: 'webp' };
    } catch {
        throw new ImageUploadError('No se pudo procesar la imagen. Verificá que el archivo no esté dañado.');
    }
}

async function writePreparedImage(
    image: PreparedImage,
    directory: UploadDirectory,
    prefix: string,
): Promise<string> {
    const uploadRoot = resolve(process.cwd(), 'uploads');
    const targetDirectory = resolve(uploadRoot, directory);
    await mkdir(targetDirectory, { recursive: true });

    const safePrefix = prefix.replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    const fileName = `${safePrefix}${randomUUID()}.${image.extension}`;
    await writeFile(resolve(targetDirectory, fileName), image.bytes, { flag: 'wx' });
    return `/uploads/${directory}/${fileName}`;
}

export async function saveUploadedImage(
    file: File,
    directory: UploadDirectory,
    prefix = '',
): Promise<string> {
    return writePreparedImage(await prepareImage(file), directory, prefix);
}

export async function saveUploadedImages(
    files: File[],
    directory: UploadDirectory,
    prefix = '',
): Promise<string[]> {
    const actualFiles = files.filter((file) => file instanceof File && file.size > 0);
    if (actualFiles.length > MAX_FILES_PER_FIELD) {
        throw new ImageUploadError(`Podés subir como máximo ${MAX_FILES_PER_FIELD} imágenes por vez`);
    }
    if (actualFiles.reduce((total, file) => total + file.size, 0) > MAX_MULTIPART_BYTES) {
        throw new ImageUploadError('El total de imágenes es demasiado grande', 413);
    }

    // Validar el lote completo antes de escribir para no dejar archivos parciales.
    const preparedImages = await Promise.all(actualFiles.map(prepareImage));
    const saved: string[] = [];
    for (const image of preparedImages) {
        saved.push(await writePreparedImage(image, directory, prefix));
    }
    return saved;
}
