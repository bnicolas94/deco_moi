# Análisis Técnico y Arquitectónico: Plataforma E-commerce "Decomoi"

Este documento detalla la estructura técnica, stack de tecnologías y módulos de negocio identificados en la plataforma del e-commerce actual. Decomoi no es un simple e-commerce transaccional, sino una plataforma compleja que involucra cotización dinámica, manufactura de insumos, integraciones multicanal y previsualización 3D.

## 1. Stack Tecnológico

El proyecto utiliza un stack moderno enfocado en alto rendimiento y tipado estricto:

*   **Framework Core:** [Astro](https://astro.build/) (Renderizado Híbrido Estático/Servidor).
*   **Librerías de UI (Islas Funcionales):** React y Preact.
*   **Gestión de Estado Global:** Nanostores (optimizado para Astro) y Zustand.
*   **Estilado:** Tailwind CSS y Tailwind Merge.
*   **Renderizado 3D y Mockups:** Three.js junto con `@react-three/fiber` y `@react-three/drei`.
*   **Base de Datos Relacional:** PostgreSQL utilizando [Drizzle ORM](https://orm.drizzle.team/) para el manejo fuertemente tipado e integridad estructural.
*   **Backend y APIs:** Handlers nativos de Astro en `src/pages/api` usando Node.js/TypeScript.
*   **Validaciones y Tipos:** TypeScript y Zod.
*   **Integraciones Clave:** MercadoPago SDK (`mercadopago`) y Nodemailer para la gestión de correos electrónicos.

---

## 2. Arquitectura de Dominio y Base de Datos

El diseño de la base de datos (gestionado en `src/lib/db/schema.ts`) revela áreas de negocio avanzadas que separan esta plataforma de soluciones estandarizadas:

### A. Catálogo y Customización Avanzada
*   **Productos y Categorías (`products`, `categories`):** Soporta descripciones, dimensiones de envío (peso/altura/ancho), y especificaciones dinámicas en JSON.
*   **Variantes Dinámicas (`productVariants`):** Permite SKUs individuales y precios customizados por variantes (ej. colores corporativos, tallas).
*   **Motor de Mockups 3D (`mockupTemplates`):** Los productos tienen configuraciones de cámara, transformaciones, pre-sets de diseño y superficies configurables que le permiten al cliente customizar su producto visualmente antes de comprar. 
*   **Reglas de Escalado:** Existen tablas para manejar reglas de precios por volumen (`priceRules`) y tiempo de producción atado a la cantidad (`productionTimeRules`).

### B. Módulo de Producción e Insumos (Manufacturing / ERP)
*   La plataforma no solo vende, sino que **calcula los costos de fabricación de sus productos.**
*   **Insumos (`supplies`):** Rastrean el stock de materia prima, proveedores, enlaces de compra y el último precio escaneado (scraping).
*   **Composición y Rinde (`supplyComposition`, `productSupplies`):** Permite armar productos complejos a partir de múltiples componentes (Bill of Materials). Contempla ratios de rinde (`yieldRatio`) y partes utilizadas, brindando un control de stock unificado.

### C. Estructura de Finanzas y Costeo Dinámico
*   **Gestor de Costos (`costItems`, `productCostItems`):** La aplicación puede aplicar diferentes modificadores de precio (fijos o porcentuales) de forma global o granular (por producto).
*   **Trazabilidad Financiera (`orderItemCosts`):** Cuando un cliente realiza una compra, la plataforma guarda el cálculo en ARS de todos los items de costo en el exacto momento de la operación para mantener precisión histórica contable.

### D. Integración Omnicanal (Mercado Libre)
Existe una robusta sincronización en doble vía con Mercado Libre:
*   **Vínculo de Publicaciones (`meliItemLinks`):** Empareja el SKU interno de Decomoi con el ID de ítem/variación de ML (ej: `MLA123456...`).
*   **Configuración de Pricing ML (`meliPricingConfig`):** Aplica la lógica de comisiones de Mercado Libre de forma nativa calculando: porcentajes de comisión, estratos de costos fijos, políticas de envío gratis, y márgenes de ganancia extra.
*   **Gestión de Órdenes ML (`meliOrders`):** Importa ventas originadas en el marketplace y maneja el monto neto deductivo.
*   **Sincronizador (`meliSyncLog`):** Todo sincronismo se registra para tener control y debugging.

### E. Órdenes, Pagos y Trackeo
*   **Gestión de Cesta y Checkout:** Órdenes estructuradas con integraciones logísticas (`zipnova_shipment_id`).
*   **Pasarelas de Pago:** Capacidad para MercadoPago (`payments`) incluyendo un proceso iterativo de análisis de transferencias bancarias no conciliadas (`unmatchedTransfers`).
*   **Cola de Mails (`emailQueue`):** Mecanismo asíncrono para enviar transaccionalidad vía Nodemailer, con intentos de reintento en caso de fallo.

---

## 3. Topología de Frontend (Interfaz y Admin)
La estructura de rutas se divide en:
1.  **Directivas de Tienda Pública (`/`, `/productos`):** Aprovechan fuertemente el renderizado SRR y SSG de Astro para SEO y performance extrema, hidratando únicamente "islas" funcionales como el carrito o customizador 3D interactivo.
2.  **Dashboard Administrativo (`/admin/*`):** Panel SPA-like completo que incluye interfaces avanzadas para gestión de Costos (`/costs`), Insumos (`/supplies`), Integración de ML (`/meli`) y el Mockup Builder 3D.

## 4. Conclusión

Decomoi es un e-commerce a medida fuertemente orientado al control de flujo operativo total (ERP y Manufacturing). Destaca por su capacidad analítica de pre-costificación de manufactura hasta llegar a la base de insumos unitarios, y su sólido lazo de automatización bidireccional con Mercado Libre para retener rentabilidad frente a la volatilidad de fees. El motor embebido de interactividad 3D le otorga una ventaja cualitativa fundamental en el segmento de retail visualmente customizable.
