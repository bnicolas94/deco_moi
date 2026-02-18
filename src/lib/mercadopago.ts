import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = import.meta.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';

if (!accessToken) {
    console.warn('MP_ACCESS_TOKEN no está configurado');
}

export const mpClient = new MercadoPagoConfig({
    accessToken: accessToken,
    options: { timeout: 5000 }
});

export const preference = new Preference(mpClient);
