import { MercadoPagoConfig, Payment } from 'mercadopago';
import dotenv from 'dotenv';
dotenv.config();

const accessToken = process.env.MP_ACCESS_TOKEN || '';

if (!accessToken) {
    console.error('MP_ACCESS_TOKEN no está configurado en .env');
    process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken: accessToken, options: { timeout: 5000 } });

async function testApi() {
    try {
        const payment = new Payment(client);

        // Search for recent payments
        const result = await payment.search({
            options: {
                criteria: 'desc',
                sort: 'date_created',
                limit: 5,
                offset: 0
            }
        });

        console.log("Ultimos 5 pagos recibidos:");
        if (result.results) {
            result.results.forEach(p => {
                console.log(`- ID: ${p.id} | Status: ${p.status} | Monto: ${p.transaction_amount} | Fecha: ${p.date_created} | Tipo: ${p.payment_type_id} | Metodo: ${p.payment_method_id} | Operacion: ${p.operation_type}`);
                if (p.payer && p.payer.identification) {
                    console.log(`  Emisor DNI: ${p.payer.identification.number}`);
                }
            });
        }
    } catch (error) {
        console.error("Error al consultar MP API:", error);
    }
}

testApi();
