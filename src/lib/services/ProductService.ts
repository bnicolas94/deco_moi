import { db } from '../db/connection';
import { products, categories, priceRules, productionTimeRules, reviews, mockupTemplates, productVariants } from '../db/schema';
import { eq, and, gte, lte, like, desc, asc, sql, or, inArray } from 'drizzle-orm';
import type { Product, Category, PriceRule, ProductionTimeRule, ProductFilters, ProductVariant } from '@/types/product';
import type { MockupTemplate } from '@/types/mockup';

// ============================================
// CATEGORÍAS
// ============================================

export async function getAllCategories(): Promise<Category[]> {
    const result = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.order));
    return result as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const result = await db.select().from(categories).where(
        and(eq(categories.slug, slug), eq(categories.isActive, true))
    ).limit(1);
    return (result[0] as Category) || null;
}

export async function getCategoryTree(): Promise<Category[]> {
    const allCats = await getAllCategories();
    const map = new Map<number, Category & { children: Category[] }>();

    // Primera pasada: crear mapa
    for (const cat of allCats) {
        map.set(cat.id, { ...cat, children: [] });
    }

    // Segunda pasada: construir árbol
    const roots: Category[] = [];
    for (const cat of allCats) {
        const node = map.get(cat.id)!;
        if (cat.parentId && map.has(cat.parentId)) {
            map.get(cat.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

export async function getCategoryWithChildren(categoryId: number): Promise<number[]> {
    const allCats = await getAllCategories();
    const ids: number[] = [categoryId];

    function findChildren(parentId: number) {
        for (const cat of allCats) {
            if (cat.parentId === parentId) {
                ids.push(cat.id);
                findChildren(cat.id);
            }
        }
    }

    findChildren(categoryId);
    return ids;
}

// ============================================
// PRODUCTOS
// ============================================

export async function getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number }> {
    const {
        categorySlug,
        minPrice,
        maxPrice,
        search,
        isFeatured,
        isOnSale,
        sortBy = 'newest',
        page = 1,
        perPage = 12,
    } = filters;

    const conditions: any[] = [eq(products.isActive, true)];

    // Filtro por categoría (incluye subcategorías)
    if (categorySlug) {
        const category = await getCategoryBySlug(categorySlug);
        if (category) {
            const categoryIds = await getCategoryWithChildren(category.id);
            conditions.push(inArray(products.categoryId, categoryIds));
        }
    }

    // Filtro por precio
    if (minPrice !== undefined) {
        conditions.push(gte(products.basePrice, minPrice.toString()));
    }
    if (maxPrice !== undefined) {
        conditions.push(lte(products.basePrice, maxPrice.toString()));
    }

    // Búsqueda por texto
    if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
            or(
                like(products.name, searchTerm),
                like(products.shortDescription, searchTerm)
            )
        );
    }

    // Filtros booleanos
    if (isFeatured) {
        conditions.push(eq(products.isFeatured, true));
    }
    if (isOnSale) {
        conditions.push(eq(products.isOnSale, true));
    }

    // Ordenamiento
    let orderClause;
    switch (sortBy) {
        case 'price-asc':
            orderClause = asc(products.basePrice);
            break;
        case 'price-desc':
            orderClause = desc(products.basePrice);
            break;
        case 'name':
            orderClause = asc(products.name);
            break;
        case 'popular':
            orderClause = desc(products.isFeatured);
            break;
        case 'newest':
        default:
            orderClause = desc(products.createdAt);
            break;
    }

    // Contar total
    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));
    const total = Number(countResult[0]?.count || 0);

    // Obtener productos paginados
    const offset = (page - 1) * perPage;
    const result = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(orderClause)
        .limit(perPage)
        .offset(offset);

    return {
        products: result as Product[],
        total,
    };
}

export async function getProductBySlug(slug: string): Promise<(Product & { mockupTemplate?: MockupTemplate | null }) | null> {
    const result = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.isActive, true)))
        .limit(1);

    if (!result[0]) return null;

    // Obtener variantes activas
    const variants = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.productId, result[0].id), eq(productVariants.isActive, true)))
        .orderBy(asc(productVariants.id));

    // Obtener reglas de precio
    const rules = await db
        .select()
        .from(priceRules)
        .where(eq(priceRules.productId, result[0].id))
        .orderBy(asc(priceRules.minQuantity));

    // Obtener categoría
    const category = await db
        .select()
        .from(categories)
        .where(eq(categories.id, result[0].categoryId))
        .limit(1);

    // Obtener template de mockup si existe
    let mockupTemplate = null;
    if (result[0].allowsMockup && result[0].mockupTemplateId) {
        const template = await db
            .select()
            .from(mockupTemplates)
            // @ts-ignore - Drizzle tipos a veces fallan con campos opcionales
            .where(eq(mockupTemplates.id, result[0].mockupTemplateId))
            .limit(1);
        mockupTemplate = template[0] || null;
    }

    // Obtener reglas de tiempo de producción
    const timeRules = await db
        .select()
        .from(productionTimeRules)
        .where(eq(productionTimeRules.productId, result[0].id))
        .orderBy(asc(productionTimeRules.minQuantity));

    return {
        ...result[0],
        variants: variants as ProductVariant[],
        priceRules: rules as PriceRule[],
        productionTimeRules: timeRules as ProductionTimeRule[],
        category: category[0] as Category,
        mockupTemplate: mockupTemplate as MockupTemplate | null,
    } as Product & { mockupTemplate?: MockupTemplate | null };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
    const result = await db
        .select()
        .from(products)
        .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
        .orderBy(desc(products.createdAt))
        .limit(limit);

    return result as Product[];
}

export async function getRelatedProducts(productId: number, categoryId: number, limit = 4): Promise<Product[]> {
    const result = await db
        .select()
        .from(products)
        .where(
            and(
                eq(products.isActive, true),
                eq(products.categoryId, categoryId),
                sql`${products.id} != ${productId}`
            )
        )
        .limit(limit);

    return result as Product[];
}

export async function getProductPriceRules(productId: number): Promise<PriceRule[]> {
    const result = await db
        .select()
        .from(priceRules)
        .where(eq(priceRules.productId, productId))
        .orderBy(asc(priceRules.minQuantity));

    return result as PriceRule[];
}

// ============================================
// CÁLCULO DE PRECIOS
// ============================================

export function calculatePrice(basePrice: number, rules: PriceRule[], quantity: number): number {
    // Buscar regla de precio aplicable
    const applicableRule = rules
        .filter(rule =>
            quantity >= rule.minQuantity &&
            (rule.maxQuantity === null || quantity <= rule.maxQuantity!)
        )
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    let unitPrice = basePrice;

    if (applicableRule) {
        if (applicableRule.fixedPrice) {
            unitPrice = Number(applicableRule.fixedPrice);
        } else if (applicableRule.discountPercentage) {
            unitPrice = basePrice * (1 - Number(applicableRule.discountPercentage) / 100);
        }
    }

    return unitPrice;
}

export function calculateTransferPrice(price: number): number {
    return price * 0.9; // 10% descuento
}

// ============================================
// RESEÑAS
// ============================================

export async function getProductReviews(productId: number) {
    const result = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
        .orderBy(desc(reviews.createdAt));

    return result;
}

// ============================================
// TIEMPO DE PRODUCCIÓN
// ============================================

export function getProductionTimeForQuantity(
    rules: ProductionTimeRule[],
    quantity: number,
    fallback: string | null
): string {
    const applicableRule = rules
        .filter(rule =>
            quantity >= rule.minQuantity &&
            (rule.maxQuantity === null || quantity <= rule.maxQuantity)
        )
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    if (applicableRule) {
        return applicableRule.productionTime;
    }

    return fallback || 'A consultar';
}
