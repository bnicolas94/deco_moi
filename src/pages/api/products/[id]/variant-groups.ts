import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { variantGroups, variantGroupOptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizePublicUrl } from '@/lib/security/html';
import { assertMultipartRequest, ImageUploadError, saveUploadedImage } from '@/lib/security/uploads';

export const PUT: APIRoute = async (context) => {
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

    const productId = parseInt(context.params.id!);
    
    let formData: FormData;
    try {
        formData = await context.request.formData();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid FormData' }), { status: 400 });
    }

    const groupsJsonStr = formData.get('groups_json')?.toString();
    if (!groupsJsonStr) {
        return new Response(JSON.stringify({ error: 'Missing groups_json' }), { status: 400 });
    }

    let groups: any[];
    try {
        groups = JSON.parse(groupsJsonStr);
        if (!Array.isArray(groups) || groups.length > 20) throw new Error('invalid groups');
    } catch {
        return new Response(JSON.stringify({ error: 'Los grupos de opciones no son válidos' }), { status: 400 });
    }

    async function uploadVGOptionImage(fieldName: string): Promise<string | null> {
        const file = formData.get(fieldName) as File | null;
        if (!file || file.size <= 0 || !file.name) return null;
        return saveUploadedImage(file, 'products', 'vg-opt-');
    }

    try {
        await db.transaction(async (tx) => {
            // Delete existing groups (cascade deletes options)
            await tx.delete(variantGroups).where(eq(variantGroups.productId, productId));

            // Insert new groups and their options
            if (groups && groups.length > 0) {
                for (let i = 0; i < groups.length; i++) {
                    const g = groups[i];
                    const [newGroup] = await tx.insert(variantGroups).values({
                        productId,
                        name: g.name,
                        displayOrder: i,
                        isRequired: g.isRequired !== false, // default true
                    }).returning({ id: variantGroups.id });

                    if (g.options && g.options.length > 0) {
                        for (let j = 0; j < g.options.length; j++) {
                            const opt = g.options[j];
                            let optImages: string[] = Array.isArray(opt.existingImages)
                                ? opt.existingImages.map((image: unknown) => sanitizePublicUrl(image)).filter(Boolean)
                                : [];
                            
                            if (opt.imageFieldNames && opt.imageFieldNames.length > 0) {
                                for (const fieldName of opt.imageFieldNames) {
                                    const uploadedUrl = await uploadVGOptionImage(fieldName);
                                    if (uploadedUrl) {
                                        optImages.push(uploadedUrl);
                                    }
                                }
                            }

                            await tx.insert(variantGroupOptions).values({
                                groupId: newGroup.id,
                                name: opt.name,
                                sku: opt.sku || null,
                                priceModifier: opt.priceModifier ? opt.priceModifier.toString() : '0',
                                stock: parseInt(opt.stock) || 0,
                                images: optImages,
                                displayOrder: j,
                                isActive: opt.isActive !== false,
                            });
                        }
                    }
                }
            }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        if (e instanceof ImageUploadError) {
            return new Response(JSON.stringify({ error: e.message }), { status: e.status });
        }
        console.error('Error saving variant groups:', e);
        return new Response(JSON.stringify({ error: 'Error al guardar grupos de opciones' }), { status: 500 });
    }
};
