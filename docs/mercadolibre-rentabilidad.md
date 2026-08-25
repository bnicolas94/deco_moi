# Mercado Libre y Rentabilidad

## Flujo implementado

1. El webhook o la importación manual obtiene la orden de Mercado Libre.
2. La orden técnica se crea o actualiza en `meli_orders` (nunca se descartan cambios de estado).
3. Cada ítem se vincula por publicación + variación; como alternativa se usa el SKU.
4. Una orden pagada y completamente vinculada crea una orden canónica en `orders` con canal `mercadolibre`.
5. Se congelan insumos, costos configurados, cantidad de packs y unidades internas.
6. Se registra el `marketplace_fee` total informado por la orden; si no está disponible, se usa `sale_fee` por unidad multiplicado por la cantidad.
7. Se consulta el costo vendedor de Mercado Envíos y, si el shipment todavía no lo informa, se conserva una estimación claramente identificada.
8. Rentabilidad incluye la operación y permite filtrar App, Mercado Libre o ambos.
9. La conciliación de cargos procesa `results[].details` por orden y sustituye estimaciones por detalles de facturación cuando ML los publica.
10. Solo se consultan órdenes no conciliadas, en lotes de hasta 60 y comenzando por las menos recientemente procesadas.
11. Una respuesta HTTP `206` se marca como parcial y se reintenta más adelante sin reemplazar costos con información incompleta.
12. Costos, insumos y asociaciones se versionan automáticamente; las nuevas importaciones usan la versión vigente en la fecha de venta.

Las ventas pagadas sin vínculo permanecen visibles en el módulo de ML y generan una alerta en Rentabilidad. Al crear o cambiar un vínculo se reprocesan automáticamente todas las órdenes importadas afectadas, incluso las que ya estaban en Rentabilidad. Las líneas existentes conservan su identidad y sus cargos conciliados; si solo cambia el pack, los costos internos se reescalan usando el valor unitario que ya estaba congelado.

## Definiciones

- **Costo fijo:** importe interno por unidad, incluidos los insumos usados por el producto.
- **Costo variable:** costo interno calculado como porcentaje del ingreso real del ítem.
- **Cargo ML:** costo por venta informado por Mercado Libre. Sus componentes estimados son informativos y no se descuentan dos veces.
- **Comisión MP:** cargo configurado provisionalmente hasta que exista detalle conciliable.
- **Impuestos / IIBB:** valor informado por la orden o estimación configurada; el detalle de facturación puede reemplazarlo.
- **Provisional:** contiene uno o más valores estimados o todavía no fue conciliado.
- **Conciliado:** los detalles de facturación disponibles fueron registrados.
- **Detalle parcial:** Mercado Libre respondió con información incompleta; se conservan los costos existentes hasta el próximo intento.
- **Fallback histórico:** para ventas anteriores al inicio del versionado no existe evidencia suficiente; se usa el valor actual y se marca como estimado.

## Configuración

- En `Costos > Biblioteca Global`, cada costo puede limitarse a App, Mercado Libre o ambos y clasificarse contablemente.
- En `Mercado Libre > Configuración`, MP e Ingresos Brutos tienen tasas estimadas independientes.
- Si ya existe un costo configurado con categoría `tax` o `payment_fee`, el importador no duplica la estimación específica de ML.

## Puesta en marcha

1. Aplicar los cambios del esquema con `npm run db:migrate` o revisar/aplicar `drizzle/migrations/0004_meli_profitability.sql`, `drizzle/migrations/0005_meli_financial_model.sql` y `drizzle/migrations/0006_cost_configuration_history.sql`.
2. Verificar los vínculos y cantidades por pack en `Mercado Libre > Gestión Externa`.
3. Ejecutar `Importar recientes`; ahora pagina el historial disponible y también actualiza órdenes ya existentes.
4. Revisar las alertas de publicaciones sin vincular.
5. Ejecutar `Conciliar cargos` cuando los detalles de facturación estén disponibles.

No se debe aplicar el archivo SQL y luego ejecutar `drizzle-kit push` contra otra base sin confirmar que ambas apuntan al mismo ambiente.
