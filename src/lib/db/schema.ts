import { pgTable, serial, text, integer, decimal, timestamp, boolean, json, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { PerspectiveConfig, SurfaceConfig, CameraConfig, DesignPresets } from '@/types/mockup';

// ============================================
// CATEGORÍAS
// ============================================
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    image: varchar('image', { length: 255 }),
    parentId: integer('parent_id'),
    order: integer('order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// PRODUCTOS
// ============================================
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    sku: varchar('sku', { length: 50 }).unique(),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
    categoryId: integer('category_id').notNull(),
    images: json('images').$type<string[]>().default([]),
    specifications: json('specifications').$type<Record<string, string>>().default({}),
    customizationOptions: json('customization_options').$type<Record<string, any>>().default({}),
    minOrder: integer('min_order').default(1),
    productionTime: varchar('production_time', { length: 50 }),
    stock: integer('stock').default(0),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    isOnSale: boolean('is_on_sale').default(false),
    salePrice: decimal('sale_price', { precision: 10, scale: 2 }),
    tags: json('tags').$type<string[]>().default([]),
    // Dimensiones para envío (opcionales, se usan defaults si no se especifican)
    weight: integer('weight'), // gramos
    height: integer('height'), // cm
    width: integer('width'),   // cm
    length: integer('length'), // cm
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    mockupTemplateId: integer('mockup_template_id'),
    allowsMockup: boolean('allows_mockup').default(false),
});

// ============================================
// REGLAS DE PRECIOS POR CANTIDAD
// ============================================
export const priceRules = pgTable('price_rules', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull(),
    minQuantity: integer('min_quantity').notNull(),
    maxQuantity: integer('max_quantity'),
    discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
    fixedPrice: decimal('fixed_price', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// REGLAS DE TIEMPO DE PRODUCCIÓN POR CANTIDAD
// ============================================
export const productionTimeRules = pgTable('production_time_rules', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull(),
    minQuantity: integer('min_quantity').notNull(),
    maxQuantity: integer('max_quantity'),
    productionTime: varchar('production_time', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// VARIANTES DE PRODUCTO (Tallas, Colores, etc.)
// ============================================
export const productVariants = pgTable('product_variants', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(), // Ej: "Rojo / XL"
    sku: varchar('sku', { length: 50 }).unique(),
    price: decimal('price', { precision: 10, scale: 2 }), // Opcional, si difiere del base
    image: varchar('image', { length: 500 }), // Imagen opcional de la variante
    stock: integer('stock').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// USUARIOS / CLIENTES
// ============================================
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: varchar('role', { length: 20 }).notNull().default('customer'),
    isGuest: boolean('is_guest').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// DIRECCIONES
// ============================================
export const addresses = pgTable('addresses', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    street: varchar('street', { length: 255 }).notNull(),
    number: varchar('number', { length: 20 }),
    floor: varchar('floor', { length: 20 }),
    apartment: varchar('apartment', { length: 20 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).default('Argentina'),
    phone: varchar('phone', { length: 20 }),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ÓRDENES / PEDIDOS
// ============================================
export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    userId: uuid('user_id'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
    shippingAddressId: integer('shipping_address_id'),
    shippingData: json('shipping_data').$type<Record<string, any>>(),
    shippingMethod: varchar('shipping_method', { length: 50 }).default('pickup'), // 'pickup' | 'delivery'
    zipnovaShipmentId: varchar('zipnova_shipment_id', { length: 100 }),
    notes: text('notes'),
    customizationDetails: json('customization_details').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// ITEMS DE ORDEN
// ============================================
export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: uuid('order_id').notNull(),
    productId: integer('product_id').notNull(),
    productName: varchar('product_name', { length: 200 }).notNull(),
    productSku: varchar('product_sku', { length: 50 }),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    customization: json('customization').$type<Record<string, any>>(),
    variantId: integer('variant_id'), // Referencia a la variante, nullable si no tiene
    productionTime: varchar('production_time', { length: 100 }), // Snapshot del tiempo de producción al crear la orden
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// PAGOS
// ============================================
export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull(),
    method: varchar('method', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    transactionId: varchar('transaction_id', { length: 255 }),
    metadata: json('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RESEÑAS
// ============================================
export const reviews = pgTable('reviews', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull(),
    userId: uuid('user_id'),
    authorName: varchar('author_name', { length: 100 }),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 200 }),
    comment: text('comment'),
    isVerified: boolean('is_verified').default(false),
    isApproved: boolean('is_approved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// CONFIGURACIÓN DEL SITIO
// ============================================
export const siteConfig = pgTable('site_config', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    value: json('value').$type<any>(),
    description: text('description'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// MOCKUP TEMPLATES
// ============================================
// ============================================
// MOCKUP TEMPLATES
// ============================================
export const mockupTemplates = pgTable('mockup_templates', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').references(() => products.id),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    mockupImageUrl: varchar('mockup_image_url', { length: 500 }).notNull(), // Renamed from baseImageUrl
    // surfaces json array
    surfaces: json('surfaces').$type<SurfaceConfig[]>().default([]),
    defaultTransform: json('default_transform').$type<{ scale: number, rotation: number }>().default({ scale: 1, rotation: 0 }),

    // Legacy/Compatibility fields required by DB schema NOT NULL constraints
    perspectiveConfig: json('perspective_config').$type<any>().default({}),
    surfaceConfig: json('surface_config').$type<any>(),
    cameraConfig: json('camera_config').$type<any>(),
    designPresets: json('design_presets').$type<any>(),

    // Legacy fields kept for compatibility or reference if needed
    metadata: json('metadata').$type<any>(),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELACIONES
// ============================================
export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: 'categoryParent',
    }),
    children: many(categories, { relationName: 'categoryParent' }),
    products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    priceRules: many(priceRules),
    productionTimeRules: many(productionTimeRules),
    reviews: many(reviews),
    variants: many(productVariants),
    mockupTemplate: one(mockupTemplates, {
        fields: [products.mockupTemplateId],
        references: [mockupTemplates.id],
    }),
    costItems: many(productCostItems),
}));

export const productionTimeRulesRelations = relations(productionTimeRules, ({ one }) => ({
    product: one(products, {
        fields: [productionTimeRules.productId],
        references: [products.id],
    }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
}));

export const mockupTemplatesRelations = relations(mockupTemplates, ({ one }) => ({
    product: one(products, {
        fields: [mockupTemplates.productId],
        references: [products.id],
    }),
}));

export const priceRulesRelations = relations(priceRules, ({ one }) => ({
    product: one(products, {
        fields: [priceRules.productId],
        references: [products.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    addresses: many(addresses),
    orders: many(orders),
    reviews: many(reviews),
    sessions: many(sessions),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
    user: one(users, {
        fields: [addresses.userId],
        references: [users.id],
    }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    items: many(orderItems),
    payments: many(payments),
    shippingAddress: one(addresses, {
        fields: [orders.shippingAddressId],
        references: [addresses.id],
    }),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [orderItems.variantId],
        references: [productVariants.id],
    }),
    costs: many(orderItemCosts),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));

// ============================================
// SESIONES (AUTH)
// ============================================
export const sessions = pgTable('sessions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// ============================================
// ANALISIS DE COSTOS
// ============================================
export const costItems = pgTable('cost_items', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'percentage' | 'fixed'
    value: decimal('value', { precision: 10, scale: 2 }).notNull(),
    isGlobal: boolean('is_global').default(false),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const productCostItems = pgTable('product_cost_items', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    costItemId: integer('cost_item_id').notNull().references(() => costItems.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const shippingRealCosts = pgTable('shipping_real_costs', {
    id: serial('id').primaryKey(),
    zone: varchar('zone', { length: 150 }).notNull().unique(), // Ej: 'CABA', 'GBA', 'Centro'
    realCost: decimal('real_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItemCosts = pgTable('order_item_costs', {
    id: serial('id').primaryKey(),
    orderItemId: integer('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
    costItemName: varchar('cost_item_name', { length: 255 }).notNull(),
    costItemType: varchar('cost_item_type', { length: 50 }).notNull(), // 'percentage' | 'fixed'
    configuredValue: decimal('configured_value', { precision: 10, scale: 2 }).notNull(),
    calculatedAmount: decimal('calculated_amount', { precision: 10, scale: 2 }).notNull(), // valor en ARS calculado en este momento
    createdAt: timestamp('created_at').defaultNow(),
});

// Relaciones Adicionales
export const costItemsRelations = relations(costItems, ({ many }) => ({
    productCostItems: many(productCostItems),
}));

export const productCostItemsRelations = relations(productCostItems, ({ one }) => ({
    product: one(products, {
        fields: [productCostItems.productId],
        references: [products.id],
    }),
    costItem: one(costItems, {
        fields: [productCostItems.costItemId],
        references: [costItems.id],
    }),
}));

export const orderItemCostsRelations = relations(orderItemCosts, ({ one }) => ({
    orderItem: one(orderItems, {
        fields: [orderItemCosts.orderItemId],
        references: [orderItems.id],
    }),
}));
