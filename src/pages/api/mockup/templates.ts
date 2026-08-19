import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { mockupTemplates, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { assertMultipartRequest, ImageUploadError, saveUploadedImage } from '@/lib/security/uploads';

const finiteCoordinate = z.number().finite().min(-1000).max(1000);
const pointSchema = z.object({ x: finiteCoordinate, y: finiteCoordinate });
const surfaceSchema = z.object({
    id: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    designArea: z.object({
        topLeft: pointSchema,
        topRight: pointSchema,
        bottomRight: pointSchema,
        bottomLeft: pointSchema
    }),
    sourceArea: z.object({
        x: finiteCoordinate,
        y: finiteCoordinate,
        width: z.number().finite().positive().max(100000),
        height: z.number().finite().positive().max(100000)
    }).optional(),
    transform: z.object({
        scale: z.number().finite().min(0.01).max(100),
        rotation: z.number().finite().min(-360).max(360),
        offsetX: finiteCoordinate,
        offsetY: finiteCoordinate
    }).optional(),
    isActive: z.boolean(),
    zIndex: z.number().int().min(-100).max(100)
});
const surfacesSchema = z.array(surfaceSchema).max(20);
const defaultTransformSchema = z.object({
    scale: z.number().finite().min(0.01).max(100),
    rotation: z.number().finite().min(-360).max(360)
});

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
    } catch (error) {
        console.error('Error loading mockup templates:', error);
        return new Response(JSON.stringify({ error: 'Error al cargar las plantillas' }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        assertMultipartRequest(request);
        const formData = await request.formData();
        const productId = formData.get('productId');
        const name = formData.get('name');
        const surfacesJson = formData.get('surfaces');
        const defaultTransformJson = formData.get('defaultTransform');
        const imageFile = formData.get('mockupImage') as File;

        if (!productId || !name || !imageFile || !surfacesJson) {
            return new Response(JSON.stringify({ error: 'Faltan datos requeridos (productId, name, surfaces, image)' }), { status: 400 });
        }

        let parsedSurfaces: unknown;
        let parsedDefaultTransform: unknown = { scale: 1, rotation: 0 };
        try {
            parsedSurfaces = JSON.parse(String(surfacesJson));
            if (defaultTransformJson) {
                parsedDefaultTransform = JSON.parse(String(defaultTransformJson));
            }
        } catch {
            return new Response(JSON.stringify({ error: 'La configuración de la plantilla no es válida' }), { status: 400 });
        }

        const surfacesResult = surfacesSchema.safeParse(parsedSurfaces);
        const defaultTransformResult = defaultTransformSchema.safeParse(parsedDefaultTransform);

        // 1. Verificar producto antes de guardar archivos
        const pid = Number(productId);
        const safeName = String(name).trim().slice(0, 200);
        if (!Number.isSafeInteger(pid) || pid <= 0 || !safeName || !surfacesResult.success || !defaultTransformResult.success) {
            return new Response(JSON.stringify({ error: 'Datos de plantilla inválidos' }), { status: 400 });
        }
        const surfaces = surfacesResult.data;
        const defaultTransform = defaultTransformResult.data;
        const productList = await db.select().from(products).where(eq(products.id, pid)).limit(1);
        if (!productList.length) {
            return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
        }
        const product = productList[0];

        // 2. Guardar una imagen validada fuera del directorio público del código.
        const publicUrl = await saveUploadedImage(imageFile, 'mockups', `mockup-${pid}-`);

        // 3. Upsert Template (Buscar si ya existe para este producto o crear uno nuevo)
        // Por simplicidad, buscamos si tiene uno asignado y lo actualizamos, o creamos nuevo.

        let templateId: number;

        const existingTemplates = await db.select().from(mockupTemplates).where(eq(mockupTemplates.productId, pid));

        if (existingTemplates.length > 0) {
            // Actualizar
            const t = existingTemplates[0];
            await db.update(mockupTemplates)
                .set({
                    name: safeName,
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
                name: safeName,
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
        if (error instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        console.error('Error saving mockup template:', error);
        return new Response(JSON.stringify({ error: 'Error al guardar la plantilla' }), { status: 500 });
    }
};
