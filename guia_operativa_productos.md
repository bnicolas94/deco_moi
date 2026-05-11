# Guía Operativa: Creación y Gestión de Productos en Decomoi

Esta guía detalla el flujo de trabajo obligatorio y la lógica de negocio para dar de alta o modificar productos en la plataforma. En Decomoi, un producto no es solo una entrada en el catálogo, sino el resultado de una suma de costos de manufactura y reglas financieras.

## 1. Filosofía de "Costo Primero"

La creación de un producto sigue una jerarquía de dependencias. No se puede definir un precio de venta de forma arbitraria; el sistema lo calcula (o valida) basándose en:
1.  **Insumos (Materia Prima):** Lo que cuesta fabricarlo.
2.  **Costos Operativos:** Impuestos, comisiones y gastos fijos.
3.  **Margen de Ganancia:** El beneficio neto deseado.

---

## 2. El Proceso de Creación (Paso a Paso)

### Paso 1: Clasificación y Base Datos
Antes de crear el producto, debe existir una **Categoría**. 
*   **Importancia:** Las categorías no solo organizan el catálogo, sino que pueden heredar reglas de pricing para Mercado Libre.
*   **Atributos Base:** Nombre, slug (URL), descripción y dimensiones (peso/alto/ancho) fundamentales para el cálculo de costos de envío.

### Paso 2: Definición de la Composición (BOM)
En la sección de **Insumos**, se vinculan los componentes necesarios para fabricar el ítem.
*   **Unidad de Medida y Rinde:** Se debe especificar cuántas unidades (o qué fracción) de un insumo se utiliza. Por ejemplo, si un rollo de vinilo rinde para 10 productos, el ratio es 0.1.
*   **Impacto:** Cualquier subida de precio en el insumo base (detectada por el scraper) disparará una alerta o actualización del precio final del producto.

### Paso 3: Capa Financiera (Cost Items)
Se aplican los modificadores de precio:
*   **Costos Fijos:** Packaging, etiquetas, mano de obra fija.
*   **Costos Porcentuales:** Impuestos (IVA, Ingresos Brutos), comisiones de pasarelas de pago.
*   **Global vs Local:** Algunos costos se aplican a toda la tienda (ej: impuestos), otros son específicos de la fabricación de ese producto.

### Paso 4: Variantes y Personalización
Si el producto tiene tallas, colores o terminaciones:
*   **Variantes:** Cada variante puede tener su propio SKU, stock e incluso un precio diferencial si el costo de fabricación varía.
*   **Mockups 3D:** Se vincula un `mockupTemplate`. Esto permite que el cliente previsualice su diseño sobre el producto real antes de comprar, lo cual es crítico para productos customizables.

### Paso 5: Sincronización con Mercado Libre
Una vez el producto existe internamente, se vincula con Mercado Libre:
*   **Meli Item Link:** Se asocia el ID de publicación (`MLA...`).
*   **Estrategia de Precio ML:** El sistema calcula el precio de venta en ML sumando:
    *   Costo de fabricación.
    *   Comisión de ML (13%, 27%, etc.).
    *   Costo fijo por venta (thresholds de ML).
    *   Costo de envío (si aplica envío gratis obligatorio).
    *   **Redondeo:** Aplica la estrategia de redondear a los $50 o $100 más cercanos.

---

## 3. Atributos Clave y su Relevancia

| Atributo | Importancia | Consecuencia de Error |
| :--- | :--- | :--- |
| **Dimensiones (W/H/L/W)** | Crítico para Logística | Cálculo erróneo de envío (pérdida de dinero). |
| **Yield Ratio (Insumos)** | Crítico para Costeo | Margen de ganancia irreal o precio fuera de mercado. |
| **SKU Interno** | Sincronización | Fallo en la actualización de stock en múltiples canales. |
| **Stock de Insumos** | Producción | Venta de productos que no se pueden fabricar. |

---

## 4. El Dashboard del Editor

El editor de productos incluye una herramienta de **Análisis de Rentabilidad** en tiempo real:
*   **Breakdown de Costos:** Visualiza cuánto del precio final se va en insumos, cuánto en impuestos y cuánto es ganancia pura.
*   **Calculadora de "Precio Sugerido":** Basado en los costos configurados, el sistema sugiere un precio para alcanzar un margen específico.
*   **Alertas de Desactualización:** Si el costo de un insumo cambió y el precio de venta no se actualizó, el editor mostrará un aviso visual destacado.

---

## 5. Conclusión Operativa

Para mantener la salud financiera de Decomoi, el administrador debe asegurarse de que la **cadena de suministro (insumos)** esté siempre actualizada. El producto es el eslabón final que consume esa información. Un error en la base (el insumo) se propaga a todos los productos y publicaciones de Mercado Libre vinculados.
