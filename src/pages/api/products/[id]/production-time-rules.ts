import type { APIRoute } from 'astro';
import { db } from '@/lib/db/connection';
import { productionTimeRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async (context) => {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
        return new Response('No autorizado', { status: 401 });
    }

    const productId = parseInt(context.params.id!);
    if (isNaN(productId)) {
        return new Response('ID inválido', { status: 400 });
    }

    try {
        const body = await context.request.json();
        const rules: Array<{ minQuantity: number; maxQuantity: number | null; productionTime: string }> = body.rules || [];

        // Validar que no haya solapamientos
        for (let i = 0; i < rules.length; i++) {
            const ruleA = rules[i];
            if (ruleA.minQuantity < 1) {
                return new Response(JSON.stringify({ error: `La cantidad mínima debe ser al menos 1 (rango ${i + 1})` }), { status: 400 });
            }
            if (ruleA.maxQuantity !== null && ruleA.maxQuantity < ruleA.minQuantity) {
                return new Response(JSON.stringify({ error: `La cantidad máxima no puede ser menor que la mínima (rango ${i + 1})` }), { status: 400 });
            }
            if (!ruleA.productionTime || ruleA.productionTime.trim() === '') {
                return new Response(JSON.stringify({ error: `El tiempo de producción es requerido (rango ${i + 1})` }), { status: 400 });
            }

            for (let j = i + 1; j < rules.length; j++) {
                const ruleB = rules[j];
                const aMin = ruleA.minQuantity;
                const aMax = ruleA.maxQuantity ?? Infinity;
                const bMin = ruleB.minQuantity;
                const bMax = ruleB.maxQuantity ?? Infinity;

                if (aMin <= bMax && bMin <= aMax) {
                    return new Response(JSON.stringify({ error: `Los rangos ${i + 1} y ${j + 1} se solapan` }), { status: 400 });
                }
            }
        }

        // Reemplazar todas las reglas: borrar existentes e insertar nuevas
        await db.transaction(async (tx) => {
            await tx.delete(productionTimeRules).where(eq(productionTimeRules.productId, productId));

            if (rules.length > 0) {
                await tx.insert(productionTimeRules).values(
                    rules.map(r => ({
                        productId,
                        minQuantity: r.minQuantity,
                        maxQuantity: r.maxQuantity,
                        productionTime: r.productionTime.trim(),
                    }))
                );
            }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        console.error('Error saving production time rules:', e);
        return new Response(JSON.stringify({ error: 'Error al guardar reglas de tiempo de producción' }), { status: 500 });
    }
};
