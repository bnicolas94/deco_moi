import { db } from './connection';
import { orders, orderItems } from './schema';
import { eq } from 'drizzle-orm';

async function checkSchema() {
    const orderId = '574ff6d1-ce34-4879-ba1f-9a4e6012aad4';
    try {
        console.log(`Consultando orden: ${orderId}`);
        const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        console.log("Datos de la orden:", JSON.stringify(order, null, 2));

        console.log(`\nConsultando ítems para la orden: ${orderId}`);
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        console.log("Ítems encontrados:", JSON.stringify(items, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Error al consultar datos:", e);
        process.exit(1);
    }
}

checkSchema();
