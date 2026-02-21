# PROMPT PARA ANTIGRAVITY — INTEGRACIÓN MERCADO LIBRE
## Proyecto: Deco Moi E-commerce
## Módulo: Ecosistema MercadoLibre (ML Sync)

---

## CONTEXTO DEL PROYECTO

Estamos desarrollando el e-commerce personalizado de **Deco Moi** (decomoi.com.ar), empresa argentina de souvenirs y regalos personalizados (chocolates artesanales, velas, tejidos, estampitas). El stack ya definido es:

- **Framework**: Astro + TypeScript
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Estilos**: Tailwind CSS
- **Hosting**: Railway
- **Autenticación admin**: JWT

El proyecto ya tiene su especificación técnica base. Esta tarea es un **módulo nuevo** que debe integrarse dentro del panel de administración existente.

---

## OBJETIVO DE ESTA TAREA

Construir un **ecosistema de integración bidireccional con MercadoLibre (MLA — Argentina)** que permita:

1. **Sincronización de precios desde Deco Moi → ML**: Cuando el admin modifica el precio de un producto en decomoi.com.ar, el sistema recalcula automáticamente el precio que debe figurar en la publicación de MercadoLibre (aplicando la regla de costos configurada) y actualiza la publicación vía API.

2. **Sincronización de stock desde Deco Moi → ML**: Cuando cambia el stock de un producto, se refleja en ML.

3. **Importación de órdenes ML → Dashboard**: Las ventas generadas en MercadoLibre se ingresan automáticamente en el sistema de órdenes de Deco Moi y se contabilizan en el dashboard de rendimiento.

4. **Panel de configuración de costos ML**: Sección en el admin donde se configuran todos los parámetros de costos de ML (comisión %, costo fijo por unidad, margen deseado, tipo de publicación, etc.) por categoría o por producto.

5. **Vinculación SKU ↔ ML Item ID**: Mecanismo para vincular cada SKU interno del ecommerce con su correspondiente publicación en MercadoLibre.

---

## REGLA DE NEGOCIO CENTRAL — CÁLCULO DE PRECIO ML

Esta es la regla más importante del módulo. El precio en MercadoLibre **siempre es mayor** al precio del ecommerce porque debe absorber la comisión de ML más el margen deseado.

### Fórmula

```
Precio ML = (Precio Base Deco Moi + Costo Fijo ML) / (1 - Comisión ML % - Margen Extra %)
```

### Componentes configurables (editables desde el admin):

| Parámetro | Descripción | Valor de referencia 2026 |
|-----------|-------------|--------------------------|
| `ml_commission_pct` | Comisión de ML según categoría | Entre 11,80% y 17,14% |
| `ml_fixed_cost` | Costo fijo por unidad vendida (solo para productos < $33.000 ARS) | $1.115 (hasta $15k) / $2.300 ($15k-$25k) / $2.810 ($25k-$33k) / $0 (>$33k) |
| `ml_listing_type` | Tipo de publicación: `gold_special` (Premium) o `gold_pro` (Clásica) | A configurar |
| `ml_extra_margin_pct` | Margen adicional de ganancia sobre ML | A definir por el negocio |
| `ml_installments_cost_pct` | Costo adicional por ofrecer cuotas sin interés | 0% a 4% según cuotas |

### Ejemplo concreto:

- Precio Deco Moi de Velas: **$100**
- Comisión ML categoría: **13%**
- Costo fijo ML: **$0** (precio > $33.000, o ajustar según valor real)
- Margen extra deseado: **10%**
- Cuotas sin interés: **no** (0%)

```
Precio ML = $100 / (1 - 0.13 - 0.10)
Precio ML = $100 / 0.77
Precio ML ≈ $129,87 → se redondea a $130
```

Si el resultado del ejemplo del usuario es $250 para un precio base de $100, significa que el margen configurado es mucho más alto (~60%). El sistema debe ser completamente flexible y configurable.

### Regla de redondeo:
El precio final ML debe redondearse al entero más cercano (sin decimales), ya que MercadoLibre no acepta centavos.

---

## APIS DE MERCADOLIBRE A USAR

### Autenticación — OAuth 2.0

**Endpoint de autorización:**
```
GET https://auth.mercadolibre.com.ar/authorization
  ?response_type=code
  &client_id=$APP_ID
  &redirect_uri=$REDIRECT_URI
```

**Intercambio de código por token:**
```
POST https://api.mercadolibre.com/oauth/token
Body (x-www-form-urlencoded):
  grant_type=authorization_code
  client_id=$APP_ID
  client_secret=$APP_SECRET
  code=$AUTHORIZATION_CODE
  redirect_uri=$REDIRECT_URI
```

**Respuesta:**
```json
{
  "access_token": "APP_USR-xxx",
  "token_type": "bearer",
  "expires_in": 21600,
  "refresh_token": "TG-xxx",
  "user_id": 123456789
}
```

**Importante:**
- El `access_token` dura **6 horas**. Hay que implementar auto-refresh con el `refresh_token`.
- Guardar en DB: `access_token`, `refresh_token`, `expires_at`, `ml_user_id`.
- Site ID para Argentina: **MLA**

---

### Endpoints principales a implementar

#### 1. Consultar comisiones en tiempo real según precio

```
GET https://api.mercadolibre.com/sites/MLA/listing_prices?price=$PRICE
Authorization: Bearer $ACCESS_TOKEN
```

Usar este endpoint para obtener las comisiones reales de ML según el precio, antes de calcular el precio final. Esto es preferible a hardcodear valores, ya que ML actualiza sus comisiones periódicamente.

#### 2. Obtener item por Item ID de ML

```
GET https://api.mercadolibre.com/items/$ITEM_ID
Authorization: Bearer $ACCESS_TOKEN
```

#### 3. Actualizar precio y stock de un item

```
PUT https://api.mercadolibre.com/items/$ITEM_ID
Authorization: Bearer $ACCESS_TOKEN
Content-Type: application/json

{
  "price": 250,
  "available_quantity": 999
}
```

#### 4. Obtener órdenes del vendedor

```
GET https://api.mercadolibre.com/orders/search?seller=$ML_USER_ID&sort=date_desc
Authorization: Bearer $ACCESS_TOKEN
```

Parámetros útiles: `date_from`, `date_to`, `order.status`, `offset`, `limit` (máx 50).

#### 5. Detalle de una orden

```
GET https://api.mercadolibre.com/orders/$ORDER_ID
Authorization: Bearer $ACCESS_TOKEN
```

#### 6. Webhook / Notificaciones en tiempo real

Suscribirse al tópico `orders_v2` para recibir notificaciones cuando se genera una nueva venta en ML sin necesidad de polling.

```
POST https://api.mercadolibre.com/applications/$APP_ID
{
  "notifications": {
    "callback_url": "https://decomoi.com.ar/api/meli/webhook",
    "topics": ["orders_v2", "items"]
  }
}
```

El webhook recibirá en `/api/meli/webhook`:
```json
{
  "resource": "/orders/123456789",
  "user_id": 987654321,
  "topic": "orders_v2",
  "application_id": 111222333,
  "attempts": 1,
  "sent": "2026-02-14T10:00:00.000-04:00",
  "received": "2026-02-14T10:00:00.000-04:00"
}
```

---

## ESQUEMA DE BASE DE DATOS — Tablas nuevas a crear

```typescript
// Tabla: vinculación SKU Deco Moi ↔ MercadoLibre
export const meliItemLinks = pgTable('meli_item_links', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  meliItemId: varchar('meli_item_id', { length: 50 }).notNull().unique(), // Ej: MLA1234567890
  meliTitle: varchar('meli_title', { length: 255 }),
  meliCategoryId: varchar('meli_category_id', { length: 50 }),
  meliListingType: varchar('meli_listing_type', { length: 50 }), // 'gold_special' | 'gold_pro' | 'free'
  lastSyncAt: timestamp('last_sync_at'),
  syncEnabled: boolean('sync_enabled').default(true),
  lastSyncedPrice: decimal('last_synced_price', { precision: 10, scale: 2 }),
  lastSyncedStock: integer('last_synced_stock'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabla: configuración de costos ML por categoría/producto
export const meliPricingConfig = pgTable('meli_pricing_config', {
  id: serial('id').primaryKey(),
  scope: varchar('scope', { length: 20 }).notNull().default('global'), // 'global' | 'category' | 'product'
  scopeId: varchar('scope_id', { length: 50 }), // ID de categoría ML o ID de producto interno
  scopeLabel: varchar('scope_label', { length: 100 }), // Nombre legible
  commissionPct: decimal('commission_pct', { precision: 5, scale: 2 }).notNull(), // Ej: 13.00
  fixedCostThreshold1: decimal('fixed_cost_threshold1', { precision: 10, scale: 2 }).default('15000'),
  fixedCostAmount1: decimal('fixed_cost_amount1', { precision: 10, scale: 2 }).default('1115'),
  fixedCostThreshold2: decimal('fixed_cost_threshold2', { precision: 10, scale: 2 }).default('25000'),
  fixedCostAmount2: decimal('fixed_cost_amount2', { precision: 10, scale: 2 }).default('2300'),
  fixedCostThreshold3: decimal('fixed_cost_threshold3', { precision: 10, scale: 2 }).default('33000'),
  fixedCostAmount3: decimal('fixed_cost_amount3', { precision: 10, scale: 2 }).default('2810'),
  extraMarginPct: decimal('extra_margin_pct', { precision: 5, scale: 2 }).default('0'),
  installmentsCostPct: decimal('installments_cost_pct', { precision: 5, scale: 2 }).default('0'),
  roundingStrategy: varchar('rounding_strategy', { length: 20 }).default('round'), // 'round' | 'ceil' | 'floor'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabla: credenciales OAuth ML
export const meliCredentials = pgTable('meli_credentials', {
  id: serial('id').primaryKey(),
  mlUserId: varchar('ml_user_id', { length: 50 }).notNull(),
  mlUserNickname: varchar('ml_user_nickname', { length: 100 }),
  accessToken: text('access_token').notNull(), // Encriptado en la DB
  refreshToken: text('refresh_token').notNull(), // Encriptado en la DB
  expiresAt: timestamp('expires_at').notNull(),
  appId: varchar('app_id', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabla: log de sincronizaciones
export const meliSyncLog = pgTable('meli_sync_log', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 30 }).notNull(), // 'price_sync' | 'stock_sync' | 'order_import'
  direction: varchar('direction', { length: 10 }).notNull(), // 'push' | 'pull'
  productId: integer('product_id'),
  meliItemId: varchar('meli_item_id', { length: 50 }),
  meliOrderId: varchar('meli_order_id', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull(), // 'success' | 'error' | 'skipped'
  details: json('details').$type<Record<string, any>>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabla: órdenes de MercadoLibre (importadas)
export const meliOrders = pgTable('meli_orders', {
  id: serial('id').primaryKey(),
  meliOrderId: varchar('meli_order_id', { length: 50 }).notNull().unique(),
  internalOrderId: uuid('internal_order_id'), // FK a orders si se crea una orden espejo
  status: varchar('status', { length: 30 }).notNull(), // 'paid' | 'cancelled' | 'pending'
  buyerNickname: varchar('buyer_nickname', { length: 100 }),
  buyerEmail: varchar('buyer_email', { length: 255 }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 10, scale: 2 }), // Total menos comisiones ML
  mlCommissionAmount: decimal('ml_commission_amount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('ARS'),
  items: json('items').$type<Array<{
    meliItemId: string;
    title: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    productId: number | null;
  }>>(),
  paymentId: varchar('payment_id', { length: 50 }),
  shippingId: varchar('shipping_id', { length: 50 }),
  dateCreated: timestamp('date_created').notNull(),
  rawData: json('raw_data').$type<Record<string, any>>(), // Data cruda de ML para referencia
  importedAt: timestamp('imported_at').defaultNow(),
});
```

---

## ESTRUCTURA DE ARCHIVOS A CREAR

Dentro del proyecto Astro existente, agregar:

```
src/
├── lib/
│   ├── services/
│   │   └── MeliService.ts          ← Lógica central de la integración
│   └── integrations/
│       └── mercadolibre/
│           ├── auth.ts              ← OAuth: obtener/refrescar tokens
│           ├── items.ts             ← Operaciones sobre publicaciones
│           ├── orders.ts            ← Lectura de órdenes
│           ├── pricing.ts           ← Calculadora de precios ML
│           └── webhooks.ts          ← Procesamiento de webhooks
│
├── pages/
│   ├── api/
│   │   └── meli/
│   │       ├── auth-callback.ts     ← Callback OAuth de ML
│   │       ├── webhook.ts           ← Receptor de notificaciones ML
│   │       ├── sync-price.ts        ← Trigger manual de sync de precio
│   │       ├── sync-stock.ts        ← Trigger manual de sync de stock
│   │       └── import-orders.ts     ← Importación manual de órdenes
│   │
│   └── admin/
│       └── meli/
│           ├── index.astro          ← Dashboard ML (métricas y estado)
│           ├── configuracion.astro  ← Config de costos y credenciales
│           ├── publicaciones.astro  ← Listado de publicaciones vinculadas
│           ├── ordenes.astro        ← Órdenes importadas de ML
│           └── sync-log.astro       ← Log de sincronizaciones
```

---

## DESCRIPCIÓN FUNCIONAL DE CADA MÓDULO

### 1. MeliService.ts — Servicio Central

```typescript
// src/lib/services/MeliService.ts

export class MeliService {
  
  // ── AUTENTICACIÓN ────────────────────────────────────────────
  
  /**
   * Genera la URL de autorización OAuth para redirigir al admin
   */
  static getAuthorizationUrl(): string;
  
  /**
   * Intercambia el código de autorización por tokens y los guarda en DB
   */
  static handleAuthCallback(code: string): Promise<MeliCredentials>;
  
  /**
   * Refresca el access token si está vencido o por vencer (< 30 min)
   */
  static ensureFreshToken(): Promise<string>;
  
  // ── CÁLCULO DE PRECIO ────────────────────────────────────────
  
  /**
   * Calcula el precio que debe tener la publicación en ML
   * dado el precio base del ecommerce y la configuración de costos.
   * 
   * Fórmula: (precioBase + costoFijoML) / (1 - comision% - margenExtra%)
   * 
   * @param basePrice - Precio en el ecommerce Deco Moi
   * @param config    - Configuración de costos ML aplicable (global, por categoría o por producto)
   * @returns Precio redondeado para publicar en ML
   */
  static calculateMeliPrice(basePrice: number, config: MeliPricingConfig): number;
  
  /**
   * Consulta la API de ML para obtener las comisiones reales por precio
   * (útil para validar contra los valores configurados)
   * GET /sites/MLA/listing_prices?price=$PRICE
   */
  static getListingPrices(price: number): Promise<MeliListingPrices>;
  
  // ── SINCRONIZACIÓN ───────────────────────────────────────────
  
  /**
   * Sincroniza precio de un producto hacia ML.
   * 1. Obtiene precio base del producto en Deco Moi
   * 2. Obtiene config de costos aplicable
   * 3. Calcula precio ML
   * 4. Llama a PUT /items/$ITEM_ID con el nuevo precio
   * 5. Registra en meli_sync_log
   */
  static syncPrice(productId: number): Promise<SyncResult>;
  
  /**
   * Sincroniza stock de un producto hacia ML.
   * PUT /items/$ITEM_ID { "available_quantity": stock }
   */
  static syncStock(productId: number): Promise<SyncResult>;
  
  /**
   * Sincroniza todos los productos con sync habilitado
   */
  static syncAll(): Promise<SyncResult[]>;
  
  // ── ÓRDENES ──────────────────────────────────────────────────
  
  /**
   * Importa órdenes de ML del período dado y las guarda en meli_orders.
   * Evita duplicados por meliOrderId.
   */
  static importOrders(dateFrom: Date, dateTo: Date): Promise<ImportResult>;
  
  /**
   * Procesa un webhook de orden nueva de ML.
   * Llama a GET /orders/$ORDER_ID, guarda en DB y notifica al admin.
   */
  static processOrderWebhook(resource: string, userId: string): Promise<void>;
}
```

---

### 2. pricing.ts — Calculadora de Precios

```typescript
// src/lib/integrations/mercadolibre/pricing.ts

interface MeliPricingConfig {
  commissionPct: number;         // Ej: 13.00 → 13%
  fixedCost: number;             // Calculado dinámicamente según precio base
  extraMarginPct: number;        // Ej: 10.00 → 10% adicional
  installmentsCostPct: number;   // Ej: 0 si no ofrece cuotas sin interés
  roundingStrategy: 'round' | 'ceil' | 'floor';
}

/**
 * Obtiene el costo fijo de ML según el precio base
 * Tabla de costos fijos Argentina 2026 (configurable desde admin):
 * - hasta $15.000: $1.115
 * - $15.001 - $25.000: $2.300
 * - $25.001 - $33.000: $2.810
 * - más de $33.000: $0
 */
export function getFixedCostForPrice(basePrice: number, config: MeliPricingConfig): number;

/**
 * Fórmula principal:
 * precioML = (basePrice + fixedCost) / (1 - totalDeductionRate)
 * donde totalDeductionRate = commissionPct + extraMarginPct + installmentsCostPct (en decimales)
 */
export function calculateMeliPrice(basePrice: number, config: MeliPricingConfig): number;

/**
 * Calcula cuánto recibiría Deco Moi neto por una venta en ML
 * (precio publicado - comisión ML - costo fijo)
 */
export function calculateNetReceived(meliPrice: number, config: MeliPricingConfig): number;

/**
 * Retorna un breakdown completo del cálculo para mostrar en el admin
 */
export function getPriceBreakdown(basePrice: number, config: MeliPricingConfig): {
  basePrice: number;
  fixedCost: number;
  mlCommissionAmount: number;
  extraMarginAmount: number;
  installmentsCostAmount: number;
  meliPrice: number;
  netReceived: number;
  effectiveMarginPct: number;
};
```

---

### 3. Panel Admin — Sección ML

#### `/admin/meli/index.astro` — Dashboard ML
Mostrar:
- Estado de la conexión (conectado/desconectado, nickname de la cuenta ML)
- Botón "Conectar con MercadoLibre" (si no hay credenciales) que inicia el OAuth
- Botón "Desconectar"
- Métricas del mes:
  - Total ventas ML (ARS)
  - Cantidad de órdenes ML
  - Ticket promedio ML
  - Comparativo: ventas Deco Moi vs ventas ML (gráfico de barras simple)
- Últimas 10 órdenes de ML
- Últimas 10 sincronizaciones (log)
- Alertas: publicaciones con error de sync, tokens próximos a vencer

#### `/admin/meli/configuracion.astro` — Configuración de Costos

**Sección 1: Credenciales**
- App ID y Secret (campos input tipo password)
- Redirect URI (campo informativo, autogenerado)
- Estado de conexión

**Sección 2: Configuración Global de Costos (default para todos los productos)**
Formulario con los campos:
- Comisión ML (%) → input numérico, ej: 13.00
- Tipo de publicación → selector: Premium (gold_special) / Clásica (gold_pro)
- Margen adicional (%) → input numérico
- ¿Ofrece cuotas sin interés? → toggle → si sí, ¿cuántas cuotas? → selector
- Costo cuotas (%) → autocalculado o manual
- Estrategia de redondeo → selector: Redondear / Hacia arriba / Hacia abajo

**Sección 3: Tabla de Costos Fijos por Rango de Precio**
Tabla editable con 4 filas (rangos de precio y su costo fijo en pesos). El admin puede actualizar estos valores cuando ML cambie sus tarifas.

**Sección 4: Configuraciones por Categoría (override)**
Tabla donde se puede agregar una fila por categoría ML con comisión específica diferente a la global.

**Sección 5: Simulador en tiempo real**
- Input: "Precio en Deco Moi"
- Output en tiempo real: precio calculado para ML + breakdown detallado
- El admin puede probar antes de aplicar

#### `/admin/meli/publicaciones.astro` — Publicaciones Vinculadas

Tabla con columnas:
- Producto Deco Moi (nombre + SKU)
- ML Item ID (editable inline para vincular/desvincular)
- Precio Deco Moi actual
- Precio ML calculado
- Precio ML real (consultado a la API)
- ¿Coinciden? (badge verde/rojo)
- Sync habilitado (toggle)
- Última sincronización
- Acciones: Sincronizar ahora / Ver en ML / Desvincular

**Búsqueda y filtros:** por nombre, SKU, estado de sync.

**Acciones masivas:**
- "Sincronizar seleccionados"
- "Sincronizar todos"

#### `/admin/meli/ordenes.astro` — Órdenes de ML

Tabla con columnas:
- N° Orden ML
- Fecha
- Comprador (nickname)
- Productos
- Total bruto
- Comisión cobrada por ML
- Neto recibido
- Estado (pagado/cancelado/pendiente)
- Link a ML

Filtros: por fecha, por estado.
Botón: "Importar órdenes recientes" (últimas 48hs).

---

## FLUJO DE SINCRONIZACIÓN DE PRECIOS — PASO A PASO

Cuando el admin edita el precio de un producto en `/admin/productos/editar/[id]`:

```
1. Admin guarda nuevo precio base en Deco Moi
   ↓
2. ProductService.updateProduct() guarda en DB
   ↓
3. Se verifica: ¿el producto tiene vinculación en meli_item_links con sync_enabled = true?
   ↓ SÍ
4. MeliService.syncPrice(productId) es llamado (puede ser await o en background)
   ↓
5. Se obtiene la config de costos ML aplicable (específica del producto > categoría > global)
   ↓
6. Se calcula el nuevo precio ML usando calculateMeliPrice()
   ↓
7. MeliService.ensureFreshToken() → refresca token si es necesario
   ↓
8. PUT https://api.mercadolibre.com/items/$MELI_ITEM_ID
   Body: { "price": precioCalculado }
   ↓
9. Si respuesta 200 → actualizar meli_item_links.last_synced_price y last_sync_at
   Si error → loguear en meli_sync_log con status 'error' + mensaje
   ↓
10. Toast notification en el admin: "✓ Precio sincronizado en MercadoLibre: $250"
    o "⚠ Error al sincronizar con ML: [mensaje]"
```

---

## FLUJO DE IMPORTACIÓN DE ÓRDENES — WEBHOOK

```
1. ML genera una venta → envía POST a /api/meli/webhook
   Body: { resource: "/orders/123456", user_id: "...", topic: "orders_v2" }
   ↓
2. Validar que la request viene de ML (verificar user_id coincide con credenciales guardadas)
   ↓
3. Extraer order_id del campo resource
   ↓
4. GET https://api.mercadolibre.com/orders/123456
   ↓
5. Verificar que no existe en meli_orders (evitar duplicados)
   ↓
6. Guardar en meli_orders con todos los datos
   ↓
7. Intentar mapear cada item al producto interno por SKU (item.seller_sku)
   ↓
8. Calcular net_amount = total_amount - comisiones ML
   ↓
9. Notificar al admin (opcional: email o notificación interna)
   ↓
10. Responder 200 OK a ML (siempre responder 200 aunque falle el procesamiento interno)
```

---

## VARIABLES DE ENTORNO NUEVAS

Agregar al `.env` y `.env.example`:

```bash
# MercadoLibre Integration
MELI_APP_ID="xxxxxxxxxxxxxxx"
MELI_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
MELI_REDIRECT_URI="http://localhost:4321/api/meli/auth-callback"
# En producción: MELI_REDIRECT_URI="https://decomoi.com.ar/api/meli/auth-callback"
MELI_SITE_ID="MLA"

# Encriptación de tokens en DB (clave de 32 caracteres)
MELI_TOKEN_ENCRYPTION_KEY="clave-secreta-de-32-caracteres-!"
```

---

## CONSIDERACIONES TÉCNICAS IMPORTANTES

### Rate Limiting de la API ML
- Límite: **1500 requests/minuto por seller**
- Implementar cola de sincronización con throttling para sync masiva
- No hacer más de 10 requests por segundo

### Refresh de Token
- El `access_token` dura 6 horas (`expires_in: 21600`)
- Antes de cada llamada a la API, verificar si `expires_at - now() < 30 minutos`
- Si sí, hacer POST a `/oauth/token` con `grant_type=refresh_token` y actualizar en DB

### Encriptación de Tokens
- El `access_token` y `refresh_token` deben guardarse encriptados en la DB (no en texto plano)
- Usar AES-256-GCM con la clave `MELI_TOKEN_ENCRYPTION_KEY`

### Manejo de Errores de la API ML
- `400 Bad Request`: precio inválido (menor al mínimo de ML = $1.000 ARS) → loguear y mostrar alerta
- `401 Unauthorized`: token vencido → auto-refresh y reintentar
- `403 Forbidden`: la publicación no pertenece al usuario conectado
- `404 Not Found`: el item ID no existe → marcar como desvinculado
- `429 Too Many Requests`: respetar el header `X-Ratelimit-Reset` y reintentar

### Sincronización en Background vs Síncrona
- Para sync individual (al guardar un producto): puede ser síncrona con timeout de 5s
- Para sync masiva ("Sincronizar todos"): usar un job en background con progreso visible

### Precio mínimo en ML
- ML Argentina requiere precio mínimo de **$1.000 ARS**
- Si el precio calculado es menor, mostrar error y bloquear la sync

---

## DATOS DE CONFIGURACIÓN INICIAL (Seeds)

Al crear las migraciones, insertar configuración global por defecto:

```sql
INSERT INTO meli_pricing_config (
  scope, scope_label, 
  commission_pct, 
  fixed_cost_threshold1, fixed_cost_amount1,
  fixed_cost_threshold2, fixed_cost_amount2,
  fixed_cost_threshold3, fixed_cost_amount3,
  extra_margin_pct, 
  installments_cost_pct, 
  rounding_strategy
) VALUES (
  'global', 'Configuración Global por Defecto',
  13.00,
  15000, 1115,
  25000, 2300,
  33000, 2810,
  0,
  0,
  'round'
);
```

---

## CRITERIOS DE ACEPTACIÓN

El módulo está completo cuando:

- [ ] El admin puede conectar la cuenta ML desde el panel (OAuth completo)
- [ ] El admin puede configurar comisión %, margen extra, costos fijos y cuotas
- [ ] El simulador muestra en tiempo real el precio ML resultante al ingresar el precio base
- [ ] Al guardar un producto con vinculación ML activa, el precio se actualiza automáticamente en ML
- [ ] Al guardar el stock de un producto, el stock se actualiza en ML
- [ ] El admin puede vincular/desvincular un SKU con un ML Item ID
- [ ] Las órdenes de ML se importan vía webhook automáticamente al generarse
- [ ] Las órdenes de ML se pueden importar manualmente para períodos pasados
- [ ] El dashboard ML muestra ventas ML consolidadas junto a ventas propias
- [ ] Hay un log de todas las sincronizaciones con estado y detalle de error
- [ ] Los tokens se almacenan encriptados y se auto-refrescan
- [ ] Todos los errores de la API ML se logean y muestran al admin con mensajes claros
- [ ] El módulo funciona en localhost para desarrollo (con ngrok o similar para webhooks)

---

## TESTING LOCAL

Para probar webhooks en local:

```bash
# Instalar ngrok o usar cloudflare tunnel
ngrok http 4321

# La URL generada (ej: https://abc123.ngrok.io) debe usarse como MELI_REDIRECT_URI
# y configurarse en el dashboard de la app de ML en developers.mercadolibre.com
```

Para crear la app ML de desarrollo:
1. Ir a https://developers.mercadolibre.com.ar
2. "Mis Aplicaciones" → "Crear aplicación"
3. Configurar Redirect URI con la URL de ngrok + `/api/meli/auth-callback`
4. Activar scopes: `offline_access`, `read`, `write`
5. Copiar App ID y Secret al `.env`

---

## NOTAS FINALES

- Los costos de ML **cambian con frecuencia** (varias veces por año). Por eso toda la configuración de porcentajes y costos fijos debe ser editable desde el admin sin tocar código.
- La API `/sites/MLA/listing_prices?price=$PRICE` puede usarse para consultar comisiones actualizadas directamente desde ML y compararlas con lo configurado — considerar mostrar un indicador de "datos en sincronía con ML" en el panel de configuración.
- Los precios en MercadoLibre son **sin decimales** (enteros). El sistema debe redondear siempre.
- Las comisiones varían por **provincia** desde julio 2025. Si el negocio está en Buenos Aires (Ciudad), usar el porcentaje de CABA.
- Respetar siempre la documentación oficial: https://developers.mercadolibre.com.ar

---

*Prompt generado para el proyecto Deco Moi — Integración MercadoLibre*
*Versión 1.0 — Febrero 2026*
