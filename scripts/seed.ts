import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:NQrNZevdzdngPgxNppBIVMzlGzBocxGs@crossover.proxy.rlwy.net:11100/railway',
    ssl: { rejectUnauthorized: false },
});

async function seed() {
    const client = await pool.connect();

    try {
        console.log('🌱 Iniciando seed de la base de datos...');

        // Limpiar tablas existentes
        await client.query('DELETE FROM price_rules');
        await client.query('DELETE FROM reviews');
        await client.query('DELETE FROM order_items');
        await client.query('DELETE FROM payments');
        await client.query('DELETE FROM orders');
        await client.query('DELETE FROM products');
        await client.query('DELETE FROM categories');
        await client.query('DELETE FROM site_config');
        console.log('✅ Tablas limpiadas');

        // ============================================
        // CATEGORÍAS
        // ============================================
        const categoriesData = [
            // Nivel 0 (raíz)
            { name: 'Productos', slug: 'productos', description: 'Todos nuestros productos', parent_id: null, order_num: 1 },
            // Nivel 1
            { name: 'Souvenirs', slug: 'souvenirs', description: 'Souvenirs personalizados para todo tipo de eventos', parent_id: 1, order_num: 1 },
            { name: 'Presentes', slug: 'presentes', description: 'Regalos y presentes especiales', parent_id: 1, order_num: 2 },
            // Nivel 2 — Souvenirs
            { name: 'Chocolates', slug: 'chocolates', description: 'Chocolates personalizados artesanales', parent_id: 2, order_num: 1 },
            { name: 'Velas', slug: 'velas', description: 'Velas aromáticas artesanales', parent_id: 2, order_num: 2 },
            { name: 'Tejidos', slug: 'tejidos', description: 'Tejidos artesanales personalizados', parent_id: 2, order_num: 3 },
            { name: 'Estampitas', slug: 'estampitas', description: 'Estampitas personalizadas', parent_id: 2, order_num: 4 },
            // Nivel 3 — Chocolates
            { name: 'Sueltos', slug: 'chocolates-sueltos', description: 'Chocolates sueltos personalizados', parent_id: 4, order_num: 1 },
            { name: 'Cajitas de 2', slug: 'cajitas-de-2', description: 'Cajas con 2 chocolates', parent_id: 4, order_num: 2 },
            { name: 'Cajitas de 4', slug: 'cajitas-de-4', description: 'Cajas con 4 chocolates', parent_id: 4, order_num: 3 },
            { name: 'Cajitas de 6', slug: 'cajitas-de-6', description: 'Cajas con 6 chocolates', parent_id: 4, order_num: 4 },
            { name: 'Cajitas de 8', slug: 'cajitas-de-8', description: 'Cajas con 8 chocolates', parent_id: 4, order_num: 5 },
            { name: 'Mini Recuerdos', slug: 'mini-recuerdos', description: 'Mini souvenirs de chocolate', parent_id: 4, order_num: 6 },
            // Nivel 4 — Cajitas de 6 (variantes)
            { name: 'Clásicas', slug: 'cajitas-6-clasicas', description: 'Cajitas de 6 versión clásica', parent_id: 11, order_num: 1 },
            { name: 'Gold', slug: 'cajitas-6-gold', description: 'Cajitas de 6 versión metalizada', parent_id: 11, order_num: 2 },
            { name: 'Deluxe', slug: 'cajitas-6-deluxe', description: 'Cajitas de 6 versión premium', parent_id: 11, order_num: 3 },
            // Nivel 2 — Presentes
            { name: 'Casuales', slug: 'presentes-casuales', description: 'Regalos casuales para toda ocasión', parent_id: 3, order_num: 1 },
            { name: 'Premium', slug: 'presentes-premium', description: 'Regalos premium de alta calidad', parent_id: 3, order_num: 2 },
        ];

        for (const cat of categoriesData) {
            await client.query(
                `INSERT INTO categories (name, slug, description, parent_id, "order", is_active) VALUES ($1, $2, $3, $4, $5, true)`,
                [cat.name, cat.slug, cat.description, cat.parent_id, cat.order_num]
            );
        }
        console.log(`✅ ${categoriesData.length} categorías insertadas`);

        // ============================================
        // PRODUCTOS
        // ============================================
        const productsData = [
            {
                name: 'Cajita "GOLD"',
                slug: 'cajita-gold',
                description: `<p>Cajita <strong>GOLD</strong> personalizada con 6 chocolatines artesanales de alta calidad.</p>
<p>La cajita tiene un exclusivo acabado <em>metalizado dorado</em> que le da un toque premium y elegante, perfecta para eventos importantes como casamientos, 15 años, bautismos y cualquier celebración que merezca un recuerdo especial.</p>
<ul>
<li>Acabado metalizado dorado de alta calidad</li>
<li>6 chocolatines artesanales de primer nivel</li>
<li>Diseño personalizado con tu evento y nombre</li>
<li>Packaging cuidado para cada unidad</li>
</ul>`,
                short_description: 'Cajita premium con acabado metalizado dorado y 6 chocolatines artesanales',
                sku: 'CJ-GOLD-6',
                base_price: 5600.00,
                category_id: 15, // Gold
                images: JSON.stringify(['/images/products/cajita-gold-1.jpg', '/images/products/cajita-gold-2.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones caja': '16×4×2 cm',
                    'Cantidad de chocolates': '6 unidades',
                    'Acabado': 'Metalizado dorado',
                    'Material caja': 'Cartón premium',
                    'Peso aprox.': '120 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'evento', 'fecha', 'colores'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: true,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'premium', 'gold', 'metalizado', 'souvenirs']),
            },
            {
                name: 'Petit Box N°4 Deluxe',
                slug: 'petit-box-n4-deluxe',
                description: `<p>La <strong>Petit Box N°4 Deluxe</strong> es nuestra opción más elegante para cajas de 4 chocolatines.</p>
<p>Incluye 4 chocolatines de primera calidad en una caja delicadamente diseñada con acabado premium. Ideal para souvenirs de casamientos, aniversarios y eventos corporativos.</p>`,
                short_description: 'Caja deluxe con 4 chocolatines premium y diseño personalizado',
                sku: 'PB-DLX-4',
                base_price: 4200.00,
                category_id: 10, // Cajitas de 4
                images: JSON.stringify(['/images/products/petit-box-deluxe-1.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones caja': '12×12×3 cm',
                    'Cantidad de chocolates': '4 unidades',
                    'Acabado': 'Deluxe premium',
                    'Peso aprox.': '90 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'evento', 'colores'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: true,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'premium', 'deluxe', 'souvenirs']),
            },
            {
                name: 'Mini Recuerdo',
                slug: 'mini-recuerdo',
                description: `<p>El <strong>Mini Recuerdo</strong> es el souvenir perfecto para quienes buscan algo delicado y económico sin resignar calidad.</p>
<p>Cada unidad viene con un chocolatín artesanal envuelto en un packaging mini personalizado con el diseño de tu evento.</p>`,
                short_description: 'Souvenir mini personalizado con chocolatín artesanal',
                sku: 'MR-MINI-1',
                base_price: 2800.00,
                category_id: 13, // Mini Recuerdos
                images: JSON.stringify(['/images/products/mini-recuerdo-1.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones': '6×4×2 cm',
                    'Cantidad de chocolates': '1 unidad',
                    'Peso aprox.': '30 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'evento', 'colores'],
                }),
                min_order: 20,
                production_time: '7-10 días hábiles',
                stock: 999,
                is_featured: true,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'mini', 'económico', 'souvenirs']),
            },
            {
                name: 'Mini Chocos Sueltos',
                slug: 'mini-chocos-sueltos',
                description: `<p>Los <strong>Mini Chocos Sueltos</strong> son chocolatines artesanales individuales, perfectos para complementar cualquier mesa de dulces o como detalle extra en eventos.</p>
<p>Cada chocolatín viene envuelto de forma individual con el diseño personalizado de tu evento.</p>`,
                short_description: 'Chocolatines sueltos artesanales con envoltorio personalizado',
                sku: 'MC-SUELTO',
                base_price: 1500.00,
                category_id: 8, // Sueltos
                images: JSON.stringify(['/images/products/mini-chocos-1.jpg']),
                specifications: JSON.stringify({
                    'Peso por unidad': '10 g',
                    'Tipo': 'Chocolate artesanal',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'colores'],
                }),
                min_order: 50,
                production_time: '7-10 días hábiles',
                stock: 999,
                is_featured: true,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'sueltos', 'económico', 'souvenirs']),
            },
            {
                name: 'Cajita Clásica 6 Chocolates',
                slug: 'cajita-clasica-6',
                description: `<p>La <strong>Cajita Clásica</strong> con 6 chocolatines es nuestro producto estrella. Un souvenir elegante y atemporal, perfecto para cualquier tipo de evento.</p>
<p>Diseño personalizado con los detalles de tu celebración en un packaging clásico de alta calidad.</p>`,
                short_description: 'Cajita clásica con 6 chocolatines artesanales personalizados',
                sku: 'CJ-CLS-6',
                base_price: 4800.00,
                category_id: 14, // Clásicas
                images: JSON.stringify(['/images/products/cajita-clasica-1.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones caja': '16×4×2 cm',
                    'Cantidad de chocolates': '6 unidades',
                    'Acabado': 'Clásico mate',
                    'Peso aprox.': '110 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'evento', 'fecha', 'colores'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'clásica', 'souvenirs']),
            },
            {
                name: 'Cajita Deluxe 6 Chocolates',
                slug: 'cajita-deluxe-6',
                description: `<p>La <strong>Cajita Deluxe</strong> con 6 chocolatines combina diseño sofisticado con un acabado premium brillante.</p>
<p>Ideal para eventos exclusivos donde cada detalle cuenta.</p>`,
                short_description: 'Cajita deluxe con acabado premium y 6 chocolatines',
                sku: 'CJ-DLX-6',
                base_price: 5200.00,
                category_id: 16, // Deluxe
                images: JSON.stringify(['/images/products/cajita-deluxe-1.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones caja': '16×4×2 cm',
                    'Cantidad de chocolates': '6 unidades',
                    'Acabado': 'Deluxe brillante',
                    'Peso aprox.': '115 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'evento', 'fecha', 'colores'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: true,
                sale_price: 4700.00,
                tags: JSON.stringify(['chocolates', 'deluxe', 'premium', 'souvenirs', 'oferta']),
            },
            {
                name: 'Cajita de 2 Chocolates',
                slug: 'cajita-2-chocolates',
                description: `<p>La <strong>Cajita de 2</strong> es perfecta para un detalle pequeño pero con gran impacto.</p>
<p>Dos chocolatines artesanales en un packaging personalizado, ideal para regalos de empresa o souvenirs simples.</p>`,
                short_description: 'Mini cajita personalizada con 2 chocolatines',
                sku: 'CJ-2',
                base_price: 2200.00,
                category_id: 9, // Cajitas de 2
                images: JSON.stringify(['/images/products/cajita-2-1.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones caja': '8×4×2 cm',
                    'Cantidad de chocolates': '2 unidades',
                    'Peso aprox.': '40 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'colores'],
                }),
                min_order: 20,
                production_time: '7-10 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'mini', 'souvenirs']),
            },
            {
                name: 'Cajita de 8 Chocolates Premium',
                slug: 'cajita-8-chocolates',
                description: `<p>La <strong>Cajita de 8 Chocolates Premium</strong> es nuestra propuesta más generosa. Ocho chocolatines artesanales en un packaging de lujo.</p>
<p>Perfecta para eventos donde querés impactar con un souvenir excepcional.</p>`,
                short_description: 'Cajita premium con 8 chocolatines artesanales',
                sku: 'CJ-8-PREM',
                base_price: 7200.00,
                category_id: 12, // Cajitas de 8
                images: JSON.stringify(['/images/products/cajita-8-1.jpg']),
                specifications: JSON.stringify({
                    'Dimensiones caja': '20×5×3 cm',
                    'Cantidad de chocolates': '8 unidades',
                    'Acabado': 'Premium',
                    'Peso aprox.': '160 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'evento', 'fecha', 'colores'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['chocolates', 'premium', '8', 'souvenirs']),
            },
            {
                name: 'Vela Aromática Personalizada',
                slug: 'vela-aromatica-personalizada',
                description: `<p>Las <strong>Velas Aromáticas Personalizadas</strong> de Deco Moi son souvenirs únicos que combinan fragancia y diseño.</p>
<p>Disponibles en distintas fragancias: vainilla, lavanda, canela y rosa. Cada vela viene con una etiqueta personalizada con los datos de tu evento.</p>`,
                short_description: 'Vela aromática artesanal con etiqueta personalizada',
                sku: 'VL-AROM',
                base_price: 3500.00,
                category_id: 5, // Velas
                images: JSON.stringify(['/images/products/vela-aromatica-1.jpg']),
                specifications: JSON.stringify({
                    'Material': 'Cera de soja',
                    'Fragancias': 'Vainilla, Lavanda, Canela, Rosa',
                    'Duración': '~20 horas',
                    'Peso': '100 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'fragancia', 'colores'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['velas', 'aromáticas', 'souvenirs']),
            },
            {
                name: 'Bolsita Tejida a Crochet',
                slug: 'bolsita-tejida-crochet',
                description: `<p>Las <strong>Bolsitas Tejidas a Crochet</strong> son souvenirs artesanales hechos a mano con amor y dedicación.</p>
<p>Cada pieza es única y viene acompañada de una tarjeta personalizada con los datos de tu evento. Disponibles en varios colores a elección.</p>`,
                short_description: 'Bolsita artesanal tejida a mano con tarjeta personalizada',
                sku: 'TJ-BOLS',
                base_price: 3800.00,
                category_id: 6, // Tejidos
                images: JSON.stringify(['/images/products/bolsita-crochet-1.jpg']),
                specifications: JSON.stringify({
                    'Material': 'Hilo de algodón',
                    'Tamaño aprox.': '8×10 cm',
                    'Colores': 'A elección',
                    'Técnica': 'Crochet artesanal',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'colores'],
                }),
                min_order: 15,
                production_time: '15-20 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['tejidos', 'crochet', 'artesanal', 'souvenirs']),
            },
            {
                name: 'Vela en Vasito de Vidrio',
                slug: 'vela-vasito-vidrio',
                description: `<p>Vela artesanal presentada en un elegante vasito de vidrio reutilizable.</p>
<p>Un souvenir premium con aroma exquisito que además es un lindo objeto decorativo para el hogar.</p>`,
                short_description: 'Vela premium en vasito de vidrio con fragancia a elección',
                sku: 'VL-VASITO',
                base_price: 4500.00,
                category_id: 5, // Velas
                images: JSON.stringify(['/images/products/vela-vasito-1.jpg']),
                specifications: JSON.stringify({
                    'Material vela': 'Cera de soja',
                    'Material envase': 'Vidrio',
                    'Fragancias': 'Vainilla, Lavanda, Canela',
                    'Duración': '~30 horas',
                    'Peso total': '180 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['nombre', 'frase', 'fragancia'],
                }),
                min_order: 10,
                production_time: '10-15 días hábiles',
                stock: 999,
                is_featured: false,
                is_on_sale: true,
                sale_price: 3900.00,
                tags: JSON.stringify(['velas', 'vidrio', 'premium', 'souvenirs', 'oferta']),
            },
            {
                name: 'Presente Casual "Dulce Detalle"',
                slug: 'presente-casual-dulce-detalle',
                description: `<p>El <strong>Presente Casual "Dulce Detalle"</strong> es un regalo pensado para sorprender sin necesidad de un evento especial.</p>
<p>Incluye una selección curada de chocolates artesanales en un packaging elegante y listo para regalar.</p>`,
                short_description: 'Regalo casual con selección de chocolates artesanales',
                sku: 'PR-CASUAL-1',
                base_price: 8500.00,
                category_id: 17, // Casuales
                images: JSON.stringify(['/images/products/presente-casual-1.jpg']),
                specifications: JSON.stringify({
                    'Contenido': 'Selección de chocolates artesanales',
                    'Packaging': 'Caja regalo + moño',
                    'Peso aprox.': '250 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['mensaje', 'colores_moño'],
                }),
                min_order: 1,
                production_time: '5-7 días hábiles',
                stock: 50,
                is_featured: false,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['presentes', 'regalo', 'chocolates']),
            },
            {
                name: 'Presente Premium "Momento Especial"',
                slug: 'presente-premium-momento-especial',
                description: `<p>El <strong>Presente Premium "Momento Especial"</strong> es nuestra propuesta de regalo más exclusiva.</p>
<p>Incluye una selección premium de chocolates, una vela aromática y un elemento sorpresa, todo presentado en un packaging de lujo.</p>`,
                short_description: 'Regalo premium con chocolates, vela y packaging de lujo',
                sku: 'PR-PREM-1',
                base_price: 15000.00,
                category_id: 18, // Premium
                images: JSON.stringify(['/images/products/presente-premium-1.jpg']),
                specifications: JSON.stringify({
                    'Contenido': 'Chocolates premium + Vela aromática + Sorpresa',
                    'Packaging': 'Caja de lujo + Lazo satinado',
                    'Peso aprox.': '500 g',
                }),
                customization_options: JSON.stringify({
                    allowsPersonalization: true,
                    fields: ['mensaje', 'fragancia_vela', 'colores'],
                }),
                min_order: 1,
                production_time: '7-10 días hábiles',
                stock: 30,
                is_featured: true,
                is_on_sale: false,
                sale_price: null,
                tags: JSON.stringify(['presentes', 'premium', 'regalo', 'lujo']),
            },
        ];

        for (const prod of productsData) {
            await client.query(
                `INSERT INTO products (name, slug, description, short_description, sku, base_price, category_id, images, specifications, customization_options, min_order, production_time, stock, is_featured, is_on_sale, sale_price, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [prod.name, prod.slug, prod.description, prod.short_description, prod.sku, prod.base_price, prod.category_id, prod.images, prod.specifications, prod.customization_options, prod.min_order, prod.production_time, prod.stock, prod.is_featured, prod.is_on_sale, prod.sale_price, prod.tags]
            );
        }
        console.log(`✅ ${productsData.length} productos insertados`);

        // ============================================
        // REGLAS DE PRECIOS
        // ============================================
        // Obtener IDs de productos
        const productIds = await client.query(`SELECT id, sku FROM products`);
        const skuMap = new Map(productIds.rows.map((r: any) => [r.sku, r.id]));

        const priceRulesData = [
            // Cajita Gold
            { sku: 'CJ-GOLD-6', min: 1, max: 49, discount: 0 },
            { sku: 'CJ-GOLD-6', min: 50, max: 99, discount: 5 },
            { sku: 'CJ-GOLD-6', min: 100, max: 199, discount: 10 },
            { sku: 'CJ-GOLD-6', min: 200, max: 499, discount: 15 },
            { sku: 'CJ-GOLD-6', min: 500, max: 999, discount: 20 },
            { sku: 'CJ-GOLD-6', min: 1000, max: 2000, discount: 25 },
            // Petit Box Deluxe
            { sku: 'PB-DLX-4', min: 1, max: 49, discount: 0 },
            { sku: 'PB-DLX-4', min: 50, max: 99, discount: 5 },
            { sku: 'PB-DLX-4', min: 100, max: 199, discount: 10 },
            { sku: 'PB-DLX-4', min: 200, max: 499, discount: 15 },
            { sku: 'PB-DLX-4', min: 500, max: 2000, discount: 20 },
            // Mini Recuerdo
            { sku: 'MR-MINI-1', min: 1, max: 49, discount: 0 },
            { sku: 'MR-MINI-1', min: 50, max: 99, discount: 5 },
            { sku: 'MR-MINI-1', min: 100, max: 199, discount: 10 },
            { sku: 'MR-MINI-1', min: 200, max: 2000, discount: 15 },
            // Mini Chocos
            { sku: 'MC-SUELTO', min: 1, max: 99, discount: 0 },
            { sku: 'MC-SUELTO', min: 100, max: 199, discount: 5 },
            { sku: 'MC-SUELTO', min: 200, max: 499, discount: 10 },
            { sku: 'MC-SUELTO', min: 500, max: 2000, discount: 15 },
            // Cajita Clásica
            { sku: 'CJ-CLS-6', min: 1, max: 49, discount: 0 },
            { sku: 'CJ-CLS-6', min: 50, max: 99, discount: 5 },
            { sku: 'CJ-CLS-6', min: 100, max: 199, discount: 10 },
            { sku: 'CJ-CLS-6', min: 200, max: 2000, discount: 15 },
            // Cajita Deluxe
            { sku: 'CJ-DLX-6', min: 1, max: 49, discount: 0 },
            { sku: 'CJ-DLX-6', min: 50, max: 99, discount: 5 },
            { sku: 'CJ-DLX-6', min: 100, max: 199, discount: 10 },
            { sku: 'CJ-DLX-6', min: 200, max: 2000, discount: 15 },
        ];

        for (const rule of priceRulesData) {
            const productId = skuMap.get(rule.sku);
            if (productId) {
                await client.query(
                    `INSERT INTO price_rules (product_id, min_quantity, max_quantity, discount_percentage) VALUES ($1, $2, $3, $4)`,
                    [productId, rule.min, rule.max, rule.discount]
                );
            }
        }
        console.log(`✅ ${priceRulesData.length} reglas de precios insertadas`);

        // ============================================
        // RESEÑAS
        // ============================================
        const reviewsData = [
            { product_sku: 'CJ-GOLD-6', author: 'Cristina Salas', rating: 5, comment: 'Super delicado todo. Nos encantó. Todo llegó en perfectas condiciones. Muchísimas gracias a todo el equipo. Super recomendables.' },
            { product_sku: 'CJ-GOLD-6', author: 'Valeria Limonoff', rating: 5, comment: 'Excelente producto, atención y envoltorio con un diseño personalizado.' },
            { product_sku: 'PB-DLX-4', author: 'Claudia V. González Díaz', rating: 5, comment: 'Excelente atención. Cumplieron con los tiempos de entrega, respondieron rápido las consultas y el resultado fue excelente. Muy recomendable.' },
            { product_sku: 'MR-MINI-1', author: 'Natalia E. Vizgarra', rating: 5, comment: 'Super delicado el souvenir. Llegó en tiempo y forma según lo acordado.' },
            { product_sku: 'CJ-GOLD-6', author: 'Sara Binder', rating: 5, comment: 'Excelente atención!! Los chocolates de calidad y la presentación, hermosa!! A partir de una idea, fueron consultándome sobre el diseño hasta que lo consideré adecuado.' },
            { product_sku: 'CJ-CLS-6', author: 'Magali Gesuelli', rating: 5, comment: 'Llegó en término y realmente muy bello presente. Muchas gracias por la dedicación... hermoso trabajo!' },
            { product_sku: 'MC-SUELTO', author: 'Natalia Arona', rating: 5, comment: 'Unos genios, excelente atención y muy lindos diseños, los colores muy ricos.' },
            { product_sku: 'VL-AROM', author: 'Erica Acosta', rating: 5, comment: 'Super super recomendables! Las botellitas son tal cual a las fotos que vi, la decoración quedó divina. Fueron muy atentos.' },
            { product_sku: 'TJ-BOLS', author: 'Noelia Peralez', rating: 5, comment: 'Hermoso trabajo! Y la atención es excelente, encantada con los souvenirs 😍' },
            { product_sku: 'CJ-DLX-6', author: 'Natalia Hernández', rating: 5, comment: 'Súper recomendables, amables, destacable la predisposición para ayudar al cliente y brindar la mejor opción. Hermosos los diseños.' },
        ];

        for (const review of reviewsData) {
            const productId = skuMap.get(review.product_sku);
            if (productId) {
                await client.query(
                    `INSERT INTO reviews (product_id, author_name, rating, comment, is_verified, is_approved) VALUES ($1, $2, $3, $4, true, true)`,
                    [productId, review.author, review.rating, review.comment]
                );
            }
        }
        console.log(`✅ ${reviewsData.length} reseñas insertadas`);

        // ============================================
        // CONFIGURACIÓN DEL SITIO
        // ============================================
        const configData = [
            {
                key: 'bank_transfer_data',
                value: JSON.stringify({ cbu: '0000000000000000000000', alias: 'DECOMOI.SOUVENIRS', holder: 'NOMBRE TITULAR', bank: 'NOMBRE BANCO', cuit: 'XX-XXXXXXXX-X' }),
                description: 'Datos bancarios para transferencias',
            },
            { key: 'bank_transfer_discount', value: JSON.stringify(10), description: 'Porcentaje de descuento por transferencia' },
            { key: 'contact_whatsapp', value: JSON.stringify('+5491112345678'), description: 'Número de WhatsApp' },
            { key: 'social_instagram', value: JSON.stringify('https://instagram.com/deco_moi'), description: 'Perfil de Instagram' },
            { key: 'social_facebook', value: JSON.stringify('https://www.facebook.com/decomoi'), description: 'Página de Facebook' },
            { key: 'promo_banner', value: JSON.stringify('10% descuento por transferencia | Pedidos urgentes por WhatsApp'), description: 'Texto del banner promocional' },
            { key: 'free_shipping_threshold', value: JSON.stringify(50000), description: 'Monto mínimo para envío gratis' },
        ];

        for (const config of configData) {
            await client.query(
                `INSERT INTO site_config (key, value, description) VALUES ($1, $2, $3)`,
                [config.key, config.value, config.description]
            );
        }
        console.log(`✅ ${configData.length} configuraciones insertadas`);

        console.log('\n🎉 Seed completado exitosamente!');
        console.log(`   📦 ${productsData.length} productos`);
        console.log(`   📂 ${categoriesData.length} categorías`);
        console.log(`   💰 ${priceRulesData.length} reglas de precios`);
        console.log(`   ⭐ ${reviewsData.length} reseñas`);
        console.log(`   ⚙️  ${configData.length} configuraciones`);

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
