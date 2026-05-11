# Análisis Técnico y Arquitectónico: Plataforma E-commerce "Decomoi"

Este documento detalla la estructura técnica, stack de tecnologías y módulos de negocio de la plataforma "Decomoi". Se trata de un sistema híbrido entre un E-commerce transaccional y un ERP/Manufacturing Tool, diseñado para gestionar cotización dinámica, manufactura de insumos, integraciones multicanal (Mercado Libre) y personalización visual 3D.

## 1. Stack Tecnológico

El proyecto utiliza un stack de alto rendimiento centrado en la integridad de datos y la velocidad de respuesta:

*   **Framework Core:** [Astro](https://astro.build/) (Renderizado Híbrido: SSG para catálogo público, SSR para panel administrativo y APIs).
*   **Librerías de UI:** React y Preact para componentes interactivos ("Islas de Astro").
*   **Gestión de Estado:** Nanostores y Zustand para reactividad en tiempo real (ej: calculadora de costos).
*   **Estilado:** Tailwind CSS con arquitectura de componentes reutilizables.
*   **Renderizado 3D:** Three.js con `@react-three/fiber` para previsualización de mockups customizables.
*   **Base de Datos:** PostgreSQL gestionado con [Drizzle ORM](https://orm.drizzle.team/), permitiendo un esquema fuertemente tipado y migraciones seguras.
*   **Backend:** API Endpoints nativos en Astro ejecutando Node.js/TypeScript.
*   **Integraciones:** MercadoPago (Pagos y Transferencias), Mercado Libre (Marketplace Sync), Nodemailer (Mails transaccionales).

---

## 2. Núcleo del Negocio: ERP e Inteligencia de Costos

A diferencia de un e-commerce estándar, Decomoi integra un motor de costeo profundo que dicta el precio de venta basado en la materia prima.

### A. Gestión de Insumos y Manufactura (BOM)
*   **Insumos (`supplies`):** Control de stock de materia prima con seguimiento de proveedores, links de compra y **Scraping Automático** de precios para mantener costos actualizados.
*   **Composición de Producto (`productSupplies`):** Estructura tipo "Bill of Materials" que vincula productos con múltiples insumos, soportando ratios de rinde (`yieldRatio`) y uso fraccionado.
*   **Recalculación Automática:** El sistema detecta cambios en el precio de un insumo y puede actualizar automáticamente el precio base de todos los productos afectados, manteniendo constante el margen de ganancia neto.

### B. Motor de Pricing Dinámico
*   **Costos Operativos (`costItems`):** Permite configurar impuestos, comisiones bancarias, packaging y otros gastos, ya sea de forma **Global** o **Por Producto**, con soporte para valores fijos o porcentuales.
*   **Editor de Productos Reactivo:** El panel administrativo cuenta con un dashboard "Sticky" que calcula en tiempo real el Breakdown de costos (Fixed vs Variable), margen de contribución y profit final mientras el usuario edita el producto.
*   **Trazabilidad Contable:** Al generarse una orden, se "congela" el breakdown de costos (`orderItemCosts`) del momento para análisis histórico de rentabilidad.

---

## 3. Integración Omnicanal: Mercado Libre

Decomoi actúa como el "cerebro" de precios para las publicaciones en Mercado Libre.

*   **Sincronización Bidireccional:** Vincula SKUs internos con IDs de ML (`meliItemLinks`).
*   **Configuración de Pricing Avanzada:**
    *   Cálculo automático de comisiones según tipo de publicación (`Gold Pro`, `Gold Special`).
    *   Lógica de **Costos Fijos por Estratos** (Thresholds configurables según el precio de venta).
    *   Gestión de **Envío Gratis**: Calcula el impacto del costo de envío en el precio final si el producto supera el umbral de ML.
    *   **Estrategias de Redondeo:** Ajuste automático de precios finales a los $50 o $100 más cercanos para mejorar la competitividad visual.
*   **Importación de Órdenes:** Las ventas en ML se integran al flujo interno para control de stock unificado.

---

## 4. Pagos y Conciliación Bancaria

*   **MercadoPago:** Integración completa para cobros con tarjeta y QR.
*   **Conciliación de Transferencias:** Motor inteligente para detectar transferencias bancarias (`money_transfer`) que no se vinculan automáticamente a una orden.
*   **Manejo de "Unmatched Transfers":** Almacena pagos no identificados para revisión manual, permitiendo asociarlos a órdenes pendientes y actualizando el estado de pago del sistema de forma segura.

---

## 5. Personalización y Experiencia de Usuario

*   **Customizador 3D:** Motor interactivo que permite aplicar diseños sobre superficies de productos (`mockupTemplates`), con control de cámara, perspectiva y materiales en tiempo real.
*   **SEO & Performance:** El catálogo público es generado estáticamente (SSG) para tiempos de carga instantáneos y optimización máxima en buscadores.
*   **Sistema de Alertas:** Panel de control que notifica discrepancias de precios o falta de stock, filtrando automáticamente items secundarios para evitar ruido visual al administrador.

---

## 6. Conclusión para Desarrollo

La plataforma Decomoi está diseñada para ser la **Única Fuente de Verdad** operativa. Cualquier desarrollo adicional debe respetar la jerarquía Insumo -> Producto -> Precio de Venta. La arquitectura modular permite escalar las integraciones (marketplaces o logísticas) manteniendo la integridad del motor de costos central.
