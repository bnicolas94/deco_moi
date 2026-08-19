import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { products, productVariants, meliItemLinks } from '@/lib/db/schema';
import { sanitizeRichText } from '@/lib/security/html';
import {
    assertMultipartRequest,
    ImageUploadError,
    saveUploadedImage,
    saveUploadedImages,
} from '@/lib/security/uploads';

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        assertMultipartRequest(context.request);
    } catch (error) {
        if (error instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        throw error;
    }

    let formData: FormData;
    try {
        formData = await context.request.formData();
    } catch (e) {
        console.error('Error parsing FormData:', e);
        return new Response('Error parsing form data', { status: 400 });
    }
    const name = formData.get('name')?.toString();
    const slug = formData.get('slug')?.toString();
    const price = parseFloat(formData.get('basePrice')?.toString() || '0');
    const stock = parseInt(formData.get('stock')?.toString() || '0');
    const categoryId = parseInt(formData.get('categoryId')?.toString() || '0');
    const description = sanitizeRichText(formData.get('description')?.toString());
    const sku = formData.get('sku')?.toString() || null;
    const isActive = formData.get('isActive') === 'true'; // Checkbox boolean
    const isFeatured = formData.get('isFeatured') === 'true';

    const imageFiles = formData.getAll('image').filter((value): value is File => value instanceof File);
    let imageUrls: string[] = [];

    try {
        if (imageFiles.length > 0) {
            imageUrls = await saveUploadedImages(imageFiles, 'products');
        }
    } catch (error) {
        if (error instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        throw error;
    }

    // Helper to upload variant images
    async function uploadVariantImage(fieldName: string): Promise<string | null> {
        const file = formData.get(fieldName) as File | null;
        if (!file || file.size <= 0 || !file.name) return null;
        return saveUploadedImage(file, 'products', 'variant-');
    }

    try {
        const result = await db.transaction(async (tx) => {
            const [newProduct] = await tx.insert(products).values({
                name: name!,
                slug: slug!,
                basePrice: price.toString(),
                stock,
                categoryId,
                description,
                shortDescription: sanitizeRichText(formData.get('shortDescription')?.toString()) || null,
                productionTime: formData.get('productionTime')?.toString() || null,
                minOrder: formData.get('minOrder') ? parseInt(formData.get('minOrder')!.toString()) : 1,
                sku,
                isActive,
                isFeatured,
                showDiscountRanges: formData.get('showDiscountRanges') === 'true',
                images: imageUrls,
            }).returning({ id: products.id });

            const variantsData = formData.get('variants_json');
            if (variantsData) {
                const variants = JSON.parse(variantsData.toString());
                if (variants.length > 0) {
                    for (const v of variants) {
                        let variantImages: string[] = [];
                        
                        if (v.imageFieldNames && v.imageFieldNames.length > 0) {
                            for (const fieldName of v.imageFieldNames) {
                                const uploadedUrl = await uploadVariantImage(fieldName);
                                if (uploadedUrl) variantImages.push(uploadedUrl);
                            }
                        }

                        await tx.insert(productVariants).values({
                            productId: newProduct.id,
                            name: v.name,
                            sku: v.sku || null,
                            price: v.price ? v.price.toString() : null,
                            stock: v.stock,
                            images: variantImages,
                        });
                    }
                }
            }

            // Integración MercadoLibre para Nuevos Productos
            const meliItemId = formData.get('meliItemId')?.toString();
            if (meliItemId) {
                await tx.insert(meliItemLinks).values({
                    productId: newProduct.id,
                    meliItemId: meliItemId,
                    syncEnabled: true,
                    lastSyncedPrice: price.toString(),
                    lastSyncedStock: stock
                });
            }

            return newProduct;
        });

        return new Response(JSON.stringify({ success: true, id: result.id }), { status: 201 });
    } catch (e) {
        if (e instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: e.message }), { status: e.status });
        }
        console.error(e);
        return new Response('Error al crear producto', { status: 500 });
    }
};

