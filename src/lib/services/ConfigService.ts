import { db } from '../db/connection';
import { siteConfig } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface CheckoutField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
    required: boolean;
    order: number;
    placeholder?: string;
    options?: { label: string; value: string }[] | string; // Para tipo select
    width?: 'full' | 'half';
}

const DEFAULT_CHECKOUT_FIELDS: CheckoutField[] = [
    { id: 'full_name', label: 'Nombre Completo', type: 'text', required: true, order: 1, width: 'full' },
    { id: 'email', label: 'Correo Electrónico', type: 'email', required: true, order: 2, width: 'half' },
    { id: 'phone', label: 'Teléfono / WhatsApp', type: 'tel', required: true, order: 3, width: 'half' },
    { id: 'street', label: 'Calle', type: 'text', required: true, order: 4, width: 'full' },
    { id: 'number', label: 'Número', type: 'text', required: true, order: 5, width: 'half' },
    { id: 'floor_apt', label: 'Piso / Depto (Opcional)', type: 'text', required: false, order: 6, width: 'half' },
    { id: 'city', label: 'Ciudad / Localidad', type: 'text', required: true, order: 7, width: 'full' },
    { id: 'state', label: 'Provincia', type: 'text', required: true, order: 8, width: 'half' },
    { id: 'postal_code', label: 'Código Postal', type: 'text', required: true, order: 9, width: 'half' },
];

export async function getCheckoutFields(): Promise<CheckoutField[]> {
    const result = await db.select().from(siteConfig).where(eq(siteConfig.key, 'checkout_form_fields')).limit(1);

    if (result.length === 0) {
        return DEFAULT_CHECKOUT_FIELDS;
    }

    return result[0].value as CheckoutField[];
}

export async function updateCheckoutFields(fields: CheckoutField[]) {
    const existing = await db.select().from(siteConfig).where(eq(siteConfig.key, 'checkout_form_fields')).limit(1);

    if (existing.length === 0) {
        await db.insert(siteConfig).values({
            key: 'checkout_form_fields',
            value: fields,
            description: 'Configuración de campos del formulario de checkout',
            updatedAt: new Date(),
        });
    } else {
        await db.update(siteConfig)
            .set({ value: fields, updatedAt: new Date() })
            .where(eq(siteConfig.key, 'checkout_form_fields'));
    }
}
