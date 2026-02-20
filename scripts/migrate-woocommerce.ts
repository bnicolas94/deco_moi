import 'dotenv/config';
import mysql from 'mysql2/promise';
import { db } from '../src/lib/db/connection';
import { categories, products } from '../src/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Rutas
const OLD_UPLOADS_DIR = path.join(process.cwd(), '.old', 'wp-content', 'uploads');
const NEW_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');
const PUBLIC_UPLOADS_PATH = '/uploads/products/';

async function migrate() {
    console.log('--- Iniciando migración de WooCommerce a PostgreSQL ---');

    // 1. Asegurar directorio de imágenes
    if (!fs.existsSync(NEW_UPLOADS_DIR)) {
        fs.mkdirSync(NEW_UPLOADS_DIR, { recursive: true });
        console.log(`Directorio creado: ${NEW_UPLOADS_DIR}`);
    }

    // 2. Conectar a MySQL (Base temporal deco_migrate)
    const mysqlConnection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'deco_migrate',
    });
    console.log('✅ Conectado a MySQL');

    let prodMigratedCount = 0;
    let missingSkusCount = 0;
    let missingCatsCount = 0;
    let missingImagesCount = 0;
    let catMigratedCount = 0;

    try {
        // ==========================================
        // MIGRAR CATEGORÍAS
        // ==========================================
        console.log('\n--- Migrando Categorías ---');
        const [oldCategoriesRows] = await mysqlConnection.query(`
            SELECT t.term_id, t.name, t.slug, tt.parent
            FROM wp_terms t
            JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
            WHERE tt.taxonomy = 'product_cat'
        `);
        const oldCats = oldCategoriesRows as any[];
        console.log(`Encontradas ${oldCats.length} categorías en WP.`);

        const categoryMap = new Map<number, number>(); // old term_id -> new id

        // Función por niveles para asegurar que el padre exista antes
        let remaining = [...oldCats];
        let level = 0;

        while (remaining.length > 0 && level < 10) {
            const nextRemaining = [];
            for (const cat of remaining) {
                const isRootOrParentMigrated = cat.parent === 0 || categoryMap.has(cat.parent);

                if (isRootOrParentMigrated) {
                    const parentId = cat.parent !== 0 ? categoryMap.get(cat.parent) : null;
                    const existingCat = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);

                    let newId: number;
                    if (existingCat.length > 0) {
                        newId = existingCat[0].id;
                        console.log(`Categoría ya existe: ${cat.name}`);
                    } else {
                        const insertedCat = await db.insert(categories).values({
                            name: cat.name,
                            slug: cat.slug,
                            parentId: parentId,
                            isActive: true,
                        }).returning({ id: categories.id });
                        newId = insertedCat[0].id;
                        console.log(`Categoría migrada: ${cat.name} (Nuevo ID: ${newId})`);
                        catMigratedCount++;
                    }
                    categoryMap.set(cat.term_id, newId);
                } else {
                    nextRemaining.push(cat);
                }
            }
            if (remaining.length === nextRemaining.length) {
                console.warn('Advertencia: Bucle cerrado en categorías. Forzando a root.');
                for (const c of nextRemaining) {
                    c.parent = 0;
                }
            }
            remaining = nextRemaining;
            level++;
        }

        // ==========================================
        // MIGRAR PRODUCTOS
        // ==========================================
        console.log('\n--- Migrando Productos ---');
        const [oldProductsRows] = await mysqlConnection.query(`
            SELECT p.ID, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_status,
                   MAX(tr.term_taxonomy_id) as category_term_id
            FROM wp_posts p
            LEFT JOIN wp_term_relationships tr ON p.ID = tr.object_id
            LEFT JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'product_cat'
            WHERE p.post_type = 'product' AND p.post_status != 'auto-draft'
            GROUP BY p.ID
        `);
        const oldProducts = oldProductsRows as any[];
        console.log(`Encontrados ${oldProducts.length} productos en WP.`);


        for (const prod of oldProducts) {
            const oldId = prod.ID;

            // Meta
            const [metaRows] = await mysqlConnection.query(`
                SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?
                AND meta_key IN ('_sku', '_price', '_regular_price', '_sale_price', '_stock', '_thumbnail_id', '_product_image_gallery')
            `, [oldId]);
            const meta = metaRows as any[];

            let sku = null;
            let basePrice = 0;
            let salePrice = null;
            let stock = 999;
            let thumbnailId = null;
            let galleryIds: string[] = [];

            for (const m of meta) {
                if (m.meta_key === '_sku' && m.meta_value) sku = m.meta_value;
                if (m.meta_key === '_regular_price' && m.meta_value) basePrice = parseFloat(m.meta_value);
                if (m.meta_key === '_price' && basePrice === 0 && m.meta_value) basePrice = parseFloat(m.meta_value); // fallback
                if (m.meta_key === '_sale_price' && m.meta_value) salePrice = parseFloat(m.meta_value);
                if (m.meta_key === '_stock' && m.meta_value !== null && m.meta_value !== '') stock = parseInt(m.meta_value);
                if (m.meta_key === '_thumbnail_id' && m.meta_value) thumbnailId = m.meta_value;
                if (m.meta_key === '_product_image_gallery' && m.meta_value) {
                    galleryIds = m.meta_value.split(',').filter((id: string) => id.trim() !== '');
                }
            }

            if (!sku || sku.trim() === '') {
                sku = `PROD-${oldId}`;
                missingSkusCount++;
            }

            const existingProd = await db.select().from(products).where(eq(products.slug, prod.post_name)).limit(1);
            if (existingProd.length > 0) {
                console.log(`Producto ya existe (por slug): ${prod.post_title}`);
                continue;
            }

            let newCategoryId = categoryMap.get(prod.category_term_id);
            if (!newCategoryId) {
                if (categoryMap.size > 0) {
                    newCategoryId = Array.from(categoryMap.values())[0];
                    missingCatsCount++;
                } else {
                    console.error('No hay categorías válidas para el producto, saltando', prod.post_title);
                    continue;
                }
            }

            const allImageIds = [];
            if (thumbnailId) allImageIds.push(thumbnailId);
            if (galleryIds.length > 0) allImageIds.push(...galleryIds);

            const finalImagePaths: string[] = [];

            if (allImageIds.length > 0) {
                const placeholders = allImageIds.map(() => '?').join(',');
                const [attachRows] = await mysqlConnection.query(`
                    SELECT post_id, meta_value as file_path 
                    FROM wp_postmeta 
                    WHERE post_id IN (${placeholders}) AND meta_key = '_wp_attached_file'
                `, allImageIds);

                const attachments = attachRows as any[];

                for (const imgId of allImageIds) {
                    const attach = attachments.find(a => a.post_id == imgId);
                    if (attach && attach.file_path) {
                        const wpPath = attach.file_path; // e.g. "2023/10/imagen.jpg" o "logo-1.png"
                        // En WP los uploads pueden venir desde el root de uploads
                        const sourceFile = path.join(OLD_UPLOADS_DIR, wpPath);
                        const fileName = path.basename(wpPath);
                        const destinationFilePath = path.join(NEW_UPLOADS_DIR, fileName);

                        if (fs.existsSync(sourceFile)) {
                            if (!fs.existsSync(destinationFilePath)) {
                                fs.copyFileSync(sourceFile, destinationFilePath);
                            }
                            finalImagePaths.push(`${PUBLIC_UPLOADS_PATH}${fileName}`);
                        } else {
                            console.warn(`⚠️ Imagen no encontrada en backup: ${wpPath}`);
                            missingImagesCount++;
                        }
                    }
                }
            }

            const isActive = prod.post_status === 'publish';
            const isOnSale = salePrice !== null && salePrice > 0;

            await db.insert(products).values({
                name: prod.post_title || 'Sin Titulo',
                slug: prod.post_name,
                description: prod.post_content || '',
                shortDescription: prod.post_excerpt ? prod.post_excerpt.substring(0, 500) : '',
                sku: sku,
                basePrice: basePrice.toString(),
                categoryId: newCategoryId,
                images: finalImagePaths,
                stock: isNaN(stock) ? 999 : stock,
                isActive: isActive,
                isOnSale: isOnSale,
                salePrice: (isOnSale && salePrice !== null) ? salePrice.toString() : null,
                isFeatured: false,
                minOrder: 10,
                specifications: {},
                customizationOptions: {},
                productionTime: null,
            });

            console.log(`Producto migrado: ${prod.post_title} (${sku})`);
            prodMigratedCount++;
        }

        console.log('\n=============================================');
        console.log('--- REPORTE FINAL ---');
        console.log(`✅ Categorías totales migradas: ${catMigratedCount}`);
        console.log(`✅ Productos totales migrados: ${prodMigratedCount}`);
        console.log(`⚠️ Productos que usaron SKU autogenerado: ${missingSkusCount}`);
        console.log(`⚠️ Productos sin categoría original (asignados a default): ${missingCatsCount}`);
        console.log(`⚠️ Imágenes no encontradas en el backup: ${missingImagesCount}`);
        console.log('=============================================');

    } catch (e) {
        console.error('Error durante la migración:', e);
    } finally {
        await mysqlConnection.end();
        console.log('Conexión a MySQL cerrada.');
        process.exit(0);
    }
}

migrate();
