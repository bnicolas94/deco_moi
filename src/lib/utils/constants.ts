// Información del sitio
export const SITE_NAME = 'Deco Moi';
export const SITE_DESCRIPTION = 'Souvenirs y regalos personalizados — Hechos con el cuidado que cada recuerdo merece';
export const SITE_URL = import.meta.env.PUBLIC_URL || 'http://localhost:4321';

// Redes sociales
export const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/deco_moi',
    facebook: 'https://www.facebook.com/decomoi',
    whatsapp: `https://wa.me/${import.meta.env.PUBLIC_WHATSAPP_NUMBER || '5491112345678'}`,
};

// Navegación principal
export const NAV_LINKS = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Contacto', href: '/contacto' },
];

// Categorías principales para navegación
export const MAIN_CATEGORIES = [
    { name: 'Chocolates', slug: 'chocolates', description: 'Chocolates personalizados' },
    { name: 'Velas', slug: 'velas', description: 'Velas artesanales' },
    { name: 'Tejidos', slug: 'tejidos', description: 'Tejidos artesanales' },
    { name: 'Estampitas', slug: 'estampitas', description: 'Estampitas personalizadas' },
    { name: 'Presentes', slug: 'presentes', description: 'Regalos y presentes' },
];

// Paginación
export const PRODUCTS_PER_PAGE = 12;

// Descuento por transferencia
export const TRANSFER_DISCOUNT = 0.10; // 10%

// Estados de pedido traducidos
export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'En producción',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

// Estados de pago traducidos
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    refunded: 'Reembolsado',
};

// Provincias argentinas (para formulario de envío)
export const ARGENTINIAN_PROVINCES = [
    'Buenos Aires',
    'Catamarca',
    'Chaco',
    'Chubut',
    'Ciudad Autónoma de Buenos Aires',
    'Córdoba',
    'Corrientes',
    'Entre Ríos',
    'Formosa',
    'Jujuy',
    'La Pampa',
    'La Rioja',
    'Mendoza',
    'Misiones',
    'Neuquén',
    'Río Negro',
    'Salta',
    'San Juan',
    'San Luis',
    'Santa Cruz',
    'Santa Fe',
    'Santiago del Estero',
    'Tierra del Fuego',
    'Tucumán',
];
