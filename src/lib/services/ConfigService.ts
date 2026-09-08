import { db } from '../db/connection';
import { siteConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
    contactFaqConfigSchema,
    DEFAULT_CONTACT_FAQ,
    type ContactFaqConfig,
} from '../config/contactFaq';

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
    { id: 'document', label: 'DNI/CUIT del destinatario', type: 'text', required: false, order: 4, width: 'half' },
    { id: 'street', label: 'Calle', type: 'text', required: true, order: 5, width: 'full' },
    { id: 'number', label: 'Número', type: 'text', required: true, order: 6, width: 'half' },
    { id: 'floor_apt', label: 'Piso / Depto (Opcional)', type: 'text', required: false, order: 7, width: 'half' },
    { id: 'city', label: 'Ciudad / Localidad', type: 'text', required: true, order: 8, width: 'full' },
    { id: 'state', label: 'Provincia', type: 'text', required: true, order: 9, width: 'half' },
    { id: 'postal_code', label: 'Código Postal', type: 'text', required: true, order: 10, width: 'half' },
];

function ensureShipmentDocumentField(fields: CheckoutField[]): CheckoutField[] {
    if (fields.some((field) => ['document', 'dni', 'cuit'].includes(field.id))) {
        return fields;
    }

    return [
        ...fields,
        {
            id: 'document',
            label: 'DNI/CUIT del destinatario',
            type: 'text',
            required: false,
            order: Math.max(0, ...fields.map((field) => field.order)) + 1,
            width: 'half',
            placeholder: 'Necesario para generar la etiqueta',
        },
    ];
}

export async function getCheckoutFields(): Promise<CheckoutField[]> {
    const result = await db.select().from(siteConfig).where(eq(siteConfig.key, 'checkout_form_fields')).limit(1);

    if (result.length === 0) {
        return DEFAULT_CHECKOUT_FIELDS;
    }

    return ensureShipmentDocumentField(result[0].value as CheckoutField[]);
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

export interface BankTransferConfig {
    holder: string;
    cvu: string;
    discount: number;
}

export async function getBankTransferConfig(): Promise<BankTransferConfig> {
    const defaultData = { holder: 'No configurado', cvu: 'No configurado', discount: 10 };
    try {
        const holderRow = await db.select().from(siteConfig).where(eq(siteConfig.key, 'bank_transfer_holder')).limit(1);
        const cvuRow = await db.select().from(siteConfig).where(eq(siteConfig.key, 'bank_transfer_cvu')).limit(1);
        const discountRow = await db.select().from(siteConfig).where(eq(siteConfig.key, 'bank_transfer_discount')).limit(1);

        return {
            holder: holderRow.length > 0 ? (holderRow[0].value as string) : defaultData.holder,
            cvu: cvuRow.length > 0 ? (cvuRow[0].value as string) : defaultData.cvu,
            discount: discountRow.length > 0 ? Number(discountRow[0].value) : defaultData.discount,
        };
    } catch (e) {
        return defaultData;
    }
}

export interface GeneralConfig {
    whatsapp: string;
    whatsappMessage: string;
    instagram: string;
}

export async function getGeneralConfig(): Promise<GeneralConfig> {
    const defaultData = { whatsapp: '', whatsappMessage: 'Hola, me gustaría hacer una consulta', instagram: '' };
    try {
        const wpRow = await db.select().from(siteConfig).where(eq(siteConfig.key, 'contact_whatsapp')).limit(1);
        const wpMsgRow = await db.select().from(siteConfig).where(eq(siteConfig.key, 'contact_whatsapp_message')).limit(1);
        const igRow = await db.select().from(siteConfig).where(eq(siteConfig.key, 'social_instagram')).limit(1);

        return {
            whatsapp: wpRow.length > 0 && wpRow[0].value ? String(wpRow[0].value) : defaultData.whatsapp,
            whatsappMessage: wpMsgRow.length > 0 && wpMsgRow[0].value ? String(wpMsgRow[0].value) : defaultData.whatsappMessage,
            instagram: igRow.length > 0 && igRow[0].value ? String(igRow[0].value) : defaultData.instagram,
        };
    } catch (e) {
        return defaultData;
    }
}

export async function getContactFaqConfig(): Promise<ContactFaqConfig> {
    try {
        const result = await db.select().from(siteConfig).where(eq(siteConfig.key, 'contact_faq')).limit(1);

        if (result.length === 0) {
            return DEFAULT_CONTACT_FAQ;
        }

        const parsed = contactFaqConfigSchema.safeParse(result[0].value);
        if (!parsed.success) {
            console.error('Invalid contact FAQ configuration:', parsed.error.flatten());
            return DEFAULT_CONTACT_FAQ;
        }

        return {
            ...parsed.data,
            items: [...parsed.data.items].sort((a, b) => a.order - b.order),
        };
    } catch (error) {
        console.error('Error fetching contact FAQ configuration:', error);
        return DEFAULT_CONTACT_FAQ;
    }
}

export async function updateContactFaqConfig(config: ContactFaqConfig): Promise<void> {
    const normalized: ContactFaqConfig = {
        ...config,
        items: config.items.map((item, index) => ({
            ...item,
            order: index + 1,
        })),
    };
    const existing = await db.select().from(siteConfig).where(eq(siteConfig.key, 'contact_faq')).limit(1);

    if (existing.length === 0) {
        await db.insert(siteConfig).values({
            key: 'contact_faq',
            value: normalized,
            description: 'Preguntas frecuentes de la página de contacto',
            updatedAt: new Date(),
        });
        return;
    }

    await db.update(siteConfig)
        .set({ value: normalized, updatedAt: new Date() })
        .where(eq(siteConfig.key, 'contact_faq'));
}
