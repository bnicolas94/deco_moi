import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { mockupTemplates, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';

// Asegurar que el directorio de upload existe
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'mockups');

async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export const GET: APIRoute = async () => {
    try {
        // Devolver lista de productos simple para el selector
        const productList = await db.select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            hasTemplate: products.allowsMockup
        }).from(products);

        return new Response(JSON.stringify(productList), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const productId = formData.get('productId');
        const name = formData.get('name');
        const surfacesJson = formData.get('surfaces');
        const defaultTransformJson = formData.get('defaultTransform');
        const imageFile = formData.get('mockupImage') as File;

        if (!productId || !name || !imageFile || !surfacesJson) {
            return new Response(JSON.stringify({ error: 'Faltan datos requeridos (productId, name, surfaces, image)' }), { status: 400 });
        }

        const surfaces = JSON.parse(surfacesJson as string);
        const defaultTransform = defaultTransformJson ? JSON.parse(defaultTransformJson as string) : { scale: 1, rotation: 0 };

        // 1. Guardar Imagen
        await ensureUploadDir();
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `mockup-${productId}-${Date.now()}.png`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        await fs.writeFile(filePath, buffer);
        const publicUrl = `/uploads/mockups/${fileName}`;

        // 2. Verificar producto
        const pid = Number(productId);
        const productList = await db.select().from(products).where(eq(products.id, pid)).limit(1);
        if (!productList.length) {
            return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
        }
        const product = productList[0];

        // 3. Upsert Template (Buscar si ya existe para este producto o crear uno nuevo)
        // Por simplicidad, buscamos si tiene uno asignado y lo actualizamos, o creamos nuevo.

        let templateId: number;

        const existingTemplates = await db.select().from(mockupTemplates).where(eq(mockupTemplates.productId, pid));

        if (existingTemplates.length > 0) {
            // Actualizar
            const t = existingTemplates[0];
            await db.update(mockupTemplates)
                .set({
                    name: name as string,
                    mockupImageUrl: publicUrl,
                    surfaces: surfaces,
                    defaultTransform: defaultTransform,
                    updatedAt: new Date()
                })
                .where(eq(mockupTemplates.id, t.id));
            templateId = t.id;
        } else {
            // Insertar
            const slug = `${product.slug}-mockup`;
            const newTemplate = await db.insert(mockupTemplates).values({
                productId: pid,
                name: name as string,
                slug: slug,
                mockupImageUrl: publicUrl,
                surfaces: surfaces,
                defaultTransform: defaultTransform,
                perspectiveConfig: {}, // Required by DB schema constraint
                isActive: true
            }).returning();
            templateId = newTemplate[0].id;
        }

        // 4. Actualizar producto para vincular
        await db.update(products)
            .set({
                mockupTemplateId: templateId,
                allowsMockup: true
            })
            .where(eq(products.id, pid));

        return new Response(JSON.stringify({
            success: true,
            templateId: templateId,
            imageUrl: publicUrl
        }), { status: 200 });

    } catch (error: any) {
        console.error('Error saving mockup template:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
