import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { saveUploadedImage } from '../src/lib/security/uploads';

test('normaliza una foto de 48 MP a un WebP apto para la tienda', async () => {
    const previousWorkingDirectory = process.cwd();
    const testDirectory = await mkdtemp(join(tmpdir(), 'decomoi-image-upload-'));

    try {
        const input = await sharp({
            create: {
                width: 6000,
                height: 8000,
                channels: 3,
                background: { r: 220, g: 190, b: 170 },
            },
        }).jpeg({ quality: 70 }).toBuffer();

        process.chdir(testDirectory);
        const publicUrl = await saveUploadedImage(
            new File([input], 'portada.jpg', { type: 'image/jpeg' }),
            'products',
        );

        assert.match(publicUrl, /^\/uploads\/products\/[a-f0-9-]+\.webp$/);
        const output = await readFile(join(testDirectory, publicUrl));
        const metadata = await sharp(output).metadata();

        assert.equal(metadata.format, 'webp');
        assert.equal(metadata.width, 1500);
        assert.equal(metadata.height, 2000);
    } finally {
        process.chdir(previousWorkingDirectory);
        await rm(testDirectory, { recursive: true, force: true });
    }
});
