# PROMPT PARA ANTIGRAVITY — Costos e Insumos en el Editor de Producto
## Proyecto: Deco Moi E-commerce
## Tarea: Agregar sección de Costos e Insumos dentro de la página de edición/creación de producto

---

## CONTEXTO

El módulo de costos actualmente vive en `/admin/costs/config` (tab "Vinculación a Productos") y es completamente funcional. No hay que tocarlo.

La necesidad es que **el mismo flujo de configuración de costos e insumos también esté disponible directamente en la página de edición/creación de un producto** (`/admin/products/[id].astro`), como una nueva sección dentro del formulario existente. El usuario no debería tener que navegar a otro módulo para ver o ajustar qué insumos usa un producto o qué costos tiene asociados.

**Regla principal: no modificar `/admin/costs/config.astro`. Solo intervenir en `/admin/products/[id].astro` y las APIs necesarias.**

---

## APIS EXISTENTES (ya funcionan, no recrear)

Estas rutas ya existen y hacen exactamente lo necesario:

```
GET  /api/products/[id]/supplies    → Devuelve insumos vinculados al producto con cantidad, yield, unitCost
POST /api/products/[id]/supplies    → Guarda (reemplaza) la lista de insumos del producto
GET  /api/products/[id]/costs       → Devuelve cost items vinculados al producto  
POST /api/products/[id]/costs       → Guarda (reemplaza) la lista de cost items del producto
```

Formato del POST a `/api/products/[id]/supplies`:
```json
{
  "supplies": [
    { "supplyId": 3, "quantity": 6, "partsUsed": null, "partsTotal": null },
    { "supplyId": 7, "quantity": null, "partsUsed": 1, "partsTotal": 4 }
  ]
}
```

Formato del POST a `/api/products/[id]/costs`:
```json
{ "costItemIds": [1, 5] }
```

---

## DATOS A CARGAR EN EL SERVER-SIDE (frontmatter de Astro)

En la sección `---` del archivo `[id].astro`, ya existe lógica para cargar `productCosts` y `productSupplies`. Se debe extender para tener **todos** los insumos y cost items disponibles para mostrarlos como opciones seleccionables:

```typescript
import { costItems, productCostItems, productSupplies, supplies, supplyCategories } from '@/lib/db/schema';

// Todos los insumos activos (para mostrar como opciones)
const allSupplies = await db.select().from(supplies)
    .where(eq(supplies.isActive, true))
    .orderBy(supplies.name);

// Insumos ya vinculados a este producto (para pre-selección)
const linkedSupplies = isNew ? [] : await db.select({
    supplyId: productSupplies.supplyId,
    quantity: productSupplies.quantity,
    partsUsed: productSupplies.partsUsed,
    partsTotal: productSupplies.partsTotal,
}).from(productSupplies).where(eq(productSupplies.productId, parseInt(id)));

// Todos los cost items activos (para mostrar como opciones)
const allCostItems = await db.select().from(costItems)
    .where(eq(costItems.isActive, true))
    .orderBy(costItems.name);

// Cost items ya vinculados a este producto (para pre-selección)
const linkedCostItemIds = isNew ? [] : (await db.select({ id: productCostItems.costItemId })
    .from(productCostItems)
    .where(eq(productCostItems.productId, parseInt(id))))
    .map(r => r.id);

// Íconos de categorías (mismo mapeo que en config.astro)
const SUPPLY_ICONS: Record<string, string> = {
    chocolates: '🍫', hojas: '📄', velas: '🕯️',
    cajas: '📦', extras: '✨', tejidos: '🧵', packaging: '📫', etiquetas: '🏷️'
};

// Categorías únicas
const supplyCategs = [...new Set(allSupplies.map(s => s.category))].sort();
```

---

## LO QUE HAY QUE CONSTRUIR

### Nueva sección en el formulario: "Costos e Insumos"

Agregar una nueva card/bloque al formulario de edición de producto, **después de la sección "Precios y Logística"** y antes de las secciones de imágenes o personalización. El bloque debe tener la misma estética visual que el resto del formulario (`bg-white rounded-2xl shadow-sm border border-gray-100`).

---

### Parte 1 — Cost Items (Comisiones y Costos Fijos)

Mostrar los cost items disponibles como checkboxes. Los globales deben aparecer pre-chequeados y deshabilitados (no se pueden desvincular desde acá). Los no-globales deben ser toggleables.

**UI de cada ítem:**
```
[ ✓ ] Comision MP      8.00%    GLOBAL   (disabled, siempre activo)
[ ✓ ] IIBB             9.00%    GLOBAL   (disabled, siempre activo)
[   ] Costo Extra      $500     POR PROD (toggleable)
```

Mostrar el badge GLOBAL en gris/indigo según corresponda, igual que en `config.astro`.

---

### Parte 2 — Insumos Utilizados

Mostrar todos los insumos activos con filtro por categoría (tabs/pills iguales a los de `config.astro`) y un buscador de texto libre. Cada insumo tiene:

- **Checkbox** para vincularlo/desvincularlo
- **Nombre** y precio unitario (`$433.25 / U`)
- **Input de cantidad** (visible solo si está chequeado)
- **Toggle de Rendimiento** (⚙️): cambia el input de "cantidad directa" a dos campos "partes usadas / partes totales" (ejemplo: 1/4 planchas). Lógica idéntica a la de `config.astro`.
- **Subtotal calculado en tiempo real** (unitCost × qty)

**Estado inicial:**
- Si el producto ya tiene insumos guardados, aparecer pre-chequeados con sus cantidades cargadas.
- Si el producto es nuevo (`isNew === true`), todo desmarcado.

---

### Parte 3 — Panel de Impacto en Tiempo Real

Un card resumen igual al "Impacto Calculado (Referencial)" de `config.astro`, pero que se actualice también cuando cambia el **Precio Base** del propio formulario:

```
┌──────────────────────────────────────┐
│  Impacto Calculado                   │
│  Precio Base:          $16,000.00    │
│  Total Costos:         -$8,249.42    │
│  Margen Bruto:          $7,750.58    │  ← en verde si positivo, rojo si negativo
│  Rentabilidad:              48.4%    │
└──────────────────────────────────────┘
```

Este panel debe recalcularse en tiempo real cuando:
- Se tilda/destilda un insumo
- Se cambia la cantidad de un insumo
- Se cambia el campo "Precio Base (Bruto)" del formulario (que ya existe con `id="basePrice"`)
- Se tilda/destilda un cost item

---

### Parte 4 — Guardado

**El guardado de costos e insumos se dispara junto con el guardado del producto**, NO es un botón separado. La lógica de submit del formulario ya existe y usa `fetch`. Hay que extenderla para que, luego de guardar el producto, haga dos POSTs adicionales:

```javascript
// Después del fetch existente de guardado del producto (que ya retorna el productId):
const productId = /* id devuelto por el fetch del producto */;

// Guardar cost items
await fetch(`/api/products/${productId}/costs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ costItemIds: selectedNonGlobalCostIds })
});

// Guardar insumos
await fetch(`/api/products/${productId}/supplies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplies: selectedSuppliesData })
});
```

**Para productos nuevos:** el `productId` lo devuelve el POST de creación del producto. Hay que capturarlo antes de llamar a los endpoints de costos/insumos.

---

## COMPORTAMIENTO PARA PRODUCTOS NUEVOS (`isNew === true`)

- Todos los cost items no-globales: desmarcados
- Los cost items globales: tildados y deshabilitados (igual que en edición)
- Todos los insumos: desmarcados, sin cantidad
- El panel de impacto muestra $0 hasta que se ingrese un precio base y se tilden insumos
- Al guardar, primero crea el producto, toma el ID de la respuesta, y luego llama a las APIs de costos/insumos con ese ID

---

## CONSIDERACIONES DE UX

- La sección debe tener un título claro: "💰 Costos e Insumos"
- Si no hay insumos activos, mostrar mensaje vacío amigable
- Si el producto no tiene costos aún (`isNew`), no es un error — simplemente todo empieza vacío
- No duplicar el cálculo de costos que ya existe más arriba en "Precios y Logística" — ese panel muestra los costos guardados al cargar la página. Esta nueva sección los muestra de forma interactiva y editable
- Los tabs de categoría de insumos y el buscador deben funcionar con JS puro (sin framework), igual que en `config.astro`
- Toda la lógica de `recalculateImpact()` puede ser una función reutilizable en el scope del `<script>` de la página

---

## ARCHIVOS A MODIFICAR

Solo estos dos:

1. **`src/pages/admin/products/[id].astro`**  
   - Extender el frontmatter para cargar `allSupplies`, `linkedSupplies`, `allCostItems`, `linkedCostItemIds`
   - Agregar la nueva sección HTML después del bloque "Precios y Logística"
   - Extender el `<script>` de la página para el recálculo dinámico y el guardado

2. **`src/lib/db/schema.ts`** *(solo si falta alguna relación necesaria)*  
   Verificar que `productSupplies` y `productCostItems` tengan las relaciones correctas para el `.innerJoin`. Probablemente ya esté.

---

## REFERENCIA VISUAL

La sección de insumos en `config.astro` ya tiene toda la lógica completa funcionando. El trabajo principal es **portarla al contexto del editor de producto**, integrando:
- El `productId` que ya está disponible como variable en la página
- El `basePrice` que ya existe como input `#basePrice` en el formulario
- El sistema de guardado existente (extenderlo, no reemplazarlo)

---

## RESULTADO ESPERADO

El usuario entra a editar/crear un producto, scrollea hacia abajo después de "Precios y Logística", y ve directamente qué insumos usa ese producto, puede agregar/quitar, ver el impacto en el margen en tiempo real, y al guardar el producto se guardan también los costos e insumos. Sin saltar a otro módulo.

---

*Prompt generado el 28 de abril de 2026*  
*Basado en análisis del repo `bnicolas94/deco_moi`*
