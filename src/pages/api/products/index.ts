import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { products, productVariants } from '@/lib/db/schema';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    const formData = await context.request.formData();
    const name = formData.get('name')?.toString();
    const slug = formData.get('slug')?.toString();
    const price = parseFloat(formData.get('basePrice')?.toString() || '0');
    const stock = parseInt(formData.get('stock')?.toString() || '0');
    const categoryId = parseInt(formData.get('categoryId')?.toString() || '0');
    const description = formData.get('description')?.toString();
    const sku = formData.get('sku')?.toString();
    const isActive = formData.get('isActive') === 'true'; // Checkbox boolean
    const isFeatured = formData.get('isFeatured') === 'true';

    const imageFiles = formData.getAll('image') as File[];
    let imageUrls: string[] = [];

    if (imageFiles && imageFiles.length > 0) {
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
        await mkdir(uploadDir, { recursive: true });

        for (const imageFile of imageFiles) {
            if (imageFile.size > 0 && imageFile.name) {
                const buffer = await imageFile.arrayBuffer();
                const ext = imageFile.name.split('.').pop();
                const fileName = `${randomUUID()}.${ext}`;

                await writeFile(join(uploadDir, fileName), new Uint8Array(buffer));
                imageUrls.push(`/uploads/products/${fileName}`);
            }
        }
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
                shortDescription: formData.get('shortDescription')?.toString() || null,
                productionTime: formData.get('productionTime')?.toString() || null,
                minOrder: formData.get('minOrder') ? parseInt(formData.get('minOrder')!.toString()) : 1,
                sku,
                isActive,
                isFeatured,
                images: imageUrls,
            }).returning({ id: products.id });

            const variantsData = formData.get('variants_json');
            if (variantsData) {
                const variants = JSON.parse(variantsData.toString());
                if (variants.length > 0) {
                    await tx.insert(productVariants).values(
                        variants.map((v: any) => ({
                            productId: newProduct.id,
                            name: v.name,
                            sku: v.sku,
                            price: v.price ? v.price.toString() : null,
                            stock: v.stock,
                        }))
                    );
                }
            }

            return newProduct;
        });

        return new Response(JSON.stringify({ success: true, id: result.id }), { status: 201 });
    } catch (e) {
        console.error(e);
        return new Response('Error al crear producto', { status: 500 });
    }
};
