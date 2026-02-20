import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { products, productVariants } from '@/lib/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const PUT: APIRoute = async (context) => {
    console.log('--- PUT Product Request ---');
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        console.log('Unauthorized');
        return new Response('No autorizado', { status: 401 });
    }

    const id = parseInt(context.params.id!);
    console.log(`Updating product ID: ${id}`);

    let formData: FormData;
    try {
        formData = await context.request.formData();
        console.log('FormData received keys:', [...formData.keys()]);
    } catch (e) {
        console.error('Error parsing FormData:', e);
        return new Response('Error parsing form data', { status: 400 });
    }

    // Extract fields
    const name = formData.get('name')?.toString();
    const slug = formData.get('slug')?.toString();
    const priceStr = formData.get('basePrice')?.toString() || '0';
    const price = parseFloat(priceStr);
    const stockStr = formData.get('stock')?.toString() || '0';
    const stock = parseInt(stockStr);
    const categoryIdStr = formData.get('categoryId')?.toString() || '0';
    const categoryId = parseInt(categoryIdStr);
    const description = formData.get('description')?.toString();
    const sku = formData.get('sku')?.toString();
    const isActive = formData.get('isActive') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';

    console.log('Parsed Fields:', { name, slug, price, stock, categoryId, isActive, isFeatured });

    // Handle Image Uploads (product images)
    const imageFiles = formData.getAll('image') as File[];
    let newImages: string[] = [];

    if (imageFiles && imageFiles.length > 0) {
        console.log(`Processing ${imageFiles.length} new images`);
        for (const imageFile of imageFiles) {
            if (imageFile.size > 0 && imageFile.name) {
                try {
                    const buffer = await imageFile.arrayBuffer();
                    const ext = imageFile.name.split('.').pop();
                    const fileName = `${randomUUID()}.${ext}`;
                    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
                    await mkdir(uploadDir, { recursive: true });

                    await writeFile(join(uploadDir, fileName), new Uint8Array(buffer));
                    newImages.push(`/uploads/products/${fileName}`);
                    console.log(`Saved new image: ${fileName}`);
                } catch (err) {
                    console.error('Error saving image file:', err);
                }
            }
        }
    }

    // Handle Variant Image Uploads
    async function uploadVariantImage(fieldName: string): Promise<string | null> {
        const file = formData.get(fieldName) as File | null;
        if (!file || file.size <= 0 || !file.name) return null;
        try {
            const buffer = await file.arrayBuffer();
            const ext = file.name.split('.').pop();
            const fileName = `variant-${randomUUID()}.${ext}`;
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
            await mkdir(uploadDir, { recursive: true });
            await writeFile(join(uploadDir, fileName), new Uint8Array(buffer));
            console.log(`Saved variant image: ${fileName}`);
            return `/uploads/products/${fileName}`;
        } catch (err) {
            console.error('Error saving variant image:', err);
            return null;
        }
    }

    try {
        // Get existing images from form data (to handle deletions)
        const keptImages = formData.getAll('existingImages').map(img => img.toString());
        const updatedImages = [...keptImages, ...newImages];

        await db.transaction(async (tx) => {
            // 1. Update Product
            await tx.update(products)
                .set({
                    name: name!,
                    slug: slug!,
                    basePrice: price.toString(),
                    stock,
                    categoryId,
                    description,
                    shortDescription: formData.get('shortDescription')?.toString() || null,
                    productionTime: formData.get('productionTime')?.toString() || null,
                    minOrder: formData.get('minOrder') ? parseInt(formData.get('minOrder')!.toString()) : 1,
                    sku,
                    isActive,
                    isFeatured,
                    images: updatedImages,
                    updatedAt: new Date(),
                })
                .where(eq(products.id, id));

            // 2. Handle Variants (with image support)
            const variantsData = formData.get('variants_json');
            if (variantsData) {
                const variants = JSON.parse(variantsData.toString());
                const variantIdsToKeep: number[] = [];

                for (const v of variants) {
                    // Determine image for this variant
                    let variantImage: string | null = v.existingImage || null;
                    if (v.hasNewImage && v.imageFieldName) {
                        const uploadedUrl = await uploadVariantImage(v.imageFieldName);
                        if (uploadedUrl) variantImage = uploadedUrl;
                    }

                    if (v.id) {
                        // Update existing variant
                        await tx.update(productVariants)
                            .set({
                                name: v.name,
                                sku: v.sku,
                                price: v.price ? v.price.toString() : null,
                                stock: v.stock,
                                image: variantImage,
                                updatedAt: new Date(),
                            })
                            .where(eq(productVariants.id, parseInt(v.id)));
                        variantIdsToKeep.push(parseInt(v.id));
                    } else {
                        // Create new variant
                        const [newV] = await tx.insert(productVariants).values({
                            productId: id,
                            name: v.name,
                            sku: v.sku,
                            price: v.price ? v.price.toString() : null,
                            stock: v.stock,
                            image: variantImage,
                        }).returning({ id: productVariants.id });
                        variantIdsToKeep.push(newV.id);
                    }
                }

                // Delete variants not in the list
                if (variantIdsToKeep.length > 0) {
                    await tx.delete(productVariants)
                        .where(and(
                            eq(productVariants.productId, id),
                            notInArray(productVariants.id, variantIdsToKeep)
                        ));
                } else {
                    // If empty list sent, delete all variants for this product
                    await tx.delete(productVariants).where(eq(productVariants.productId, id));
                }
            }
        });

        console.log('Transaction successful');
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Database Error:', e);
        return new Response('Error al actualizar producto', { status: 500 });
    }
};


export const DELETE: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }
    const id = parseInt(context.params.id!);
    try {
        await db.delete(products).where(eq(products.id, id));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response('Error al eliminar producto', { status: 500 });
    }
};
