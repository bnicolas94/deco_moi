import type { APIRoute } from 'astro';
import { assertMultipartRequest, ImageUploadError, saveUploadedImages } from '@/lib/security/uploads';

export const POST: APIRoute = async (context) => {
    try {
        assertMultipartRequest(context.request);
        const formData = await context.request.formData();
        const images = formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0);

        if (images.length === 0) {
            return new Response(JSON.stringify({ error: 'Seleccioná al menos una imagen' }), { status: 400 });
        }
        if (images.length > 6) {
            return new Response(JSON.stringify({ error: 'Podés subir hasta 6 imágenes por vez' }), { status: 400 });
        }

        const urls = await saveUploadedImages(images, 'home', 'occasion-');
        return new Response(JSON.stringify({ urls }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        if (error instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        console.error('Error uploading home images:', error);
        return new Response(JSON.stringify({ error: 'No se pudieron subir las imágenes' }), { status: 500 });
    }
};
