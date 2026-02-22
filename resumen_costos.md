# Resumen Arquitectura y Funcionalidad: Sistema de Costos y Precios

Este documento resume las implementaciones recientes relacionadas con el módulo de costos y la fijación de precios en el sistema de `decomoi_v2`.

## 1. Esquema de Base de Datos (Drizzle ORM)

Se crearon e integraron nuevas tablas para manejar los costos de forma dinámica:

*   **`costItems`**: Define los tipos de costos disponibles.
    *   Campos clave: `id`, `name`, `type` ('fixed' o 'percentage'), `value` (numeric), `isActive` (boolean), `isGlobal` (boolean).
    *   *Nota:* El campo `isGlobal` permite que un costo (ej. Ingresos Brutos) aplique automáticamente a todos los productos sin necesidad de asignarlo uno por uno.

*   **`productCostItems`**: Tabla relacional (muchos a muchos) que vincula productos específicos con items de costo.
    *   Campos clave: `productId`, `costItemId`.

*   **`orderCosts`**: Toma una "foto" (snapshot) de los costos en el momento exacto en que se realiza una venta.
    *   Campos clave: `id`, `orderId`, `orderItemId`, `name`, `type`, `value` (numeric), `amount` (numeric - el monto monetario real calculado para ese item en esa orden).

## 2. Lógica de Órdenes y Snapshots (OrderService.ts)

Al momento de ejecutarse el checkout (`createOrderFromCheckout`):

1.  Se obtienen todos los costos globales activos (`isGlobal = true`).
2.  Por cada producto en el carrito, se obtienen sus costos específicos asignados en `productCostItems`.
3.  **Merge de Costos**: Se fusionan los costos globales con los específicos del producto. *Regla de negocio:* Si hay un costo con el mismo `name`, el costo específico del producto sobrescribe al costo global.
4.  Se calcula el monto real (`amount`) de cada costo en base al precio y cantidad del producto en ese momento.
5.  Se guardan estos registros inmutables en la tabla `orderCosts` para asegurar que reportes futuros no se alteren si cambian las configuraciones de costos.

## 3. UI/UX - Configuración de Costos (`/admin/costs/config`)

Pantalla de administración para gestionar la tabla `costItems`.
*   Permite crear, editar, eliminar y activar/desactivar costos.
*   Incluye un **Toggle Global** para aplicar costos a todo el catálogo.
*   Muestra visualmente (con badges) cuáles costos son globales y cuáles requieren asignación manual.

## 4. Dashboard de Rentabilidad (`/admin/costs/dashboard`)

Panel analítico que cruza la información de ventas con los costos registrados (`orderCosts`).
*   **API (`/api/costs/dashboard-stats.ts`)**: Calcula ingresos brutos totales, costos fijos totales, costos variables totales y el **Ingreso Neto Real**.
*   *Filtro crìtico:* Sólo considera órdenes cuyo `paymentStatus` sea `'APPROVED'`, garantizando que la rentabilidad se base en dinero real ingresado, independientemente de si la orden está en preparación o enviada.

## 5. Edición de Producto: Cálculo de Precio Inverso (`/admin/products/[id].astro`)

Interfaz interactiva en la creación/edición de productos para facilitar el "Pricing".

*   **Campos UI**:
    *   `Precio Base (Bruto)`: El precio final de venta al público.
    *   `Neto Deseado`: Cuánta plata limpia se espera ganar por unidad.
    *   `Costo Fijo Total`: Etiqueta visual (sólo lectura) que suma los valores de los costos fijos.
    *   `Botones Multiplicadores (x2, x3, x4)`: Permiten multiplicar el costo fijo y auto-completar el Neto Deseado.

*   **Lógica de Cálculo (Client-side JS)**:
    *   El backend inyecta un array `allCosts` (fusionando globales y específicos) en el HTML.
    *   El JS calcula `totalFixed` y `totalPerc`.
    *   **Neto a Bruto**: `Bruto = (Neto + Costos Fijos) / (1 - %Variable/100)`
    *   **Bruto a Neto**: `Neto = Bruto - Costos Fijos - (Bruto * %Variable/100)`
    *   Eventos `input` bidireccionales mantienen ambos campos sincronizados en tiempo real.
    *   Al hacer click en un botón multiplicador (ej. x3), se calcula `Costo Fijo Total * 3`, se inserta en `Neto Deseado`, y se dispara automáticamente el recálculo del `Precio Bruto`.
