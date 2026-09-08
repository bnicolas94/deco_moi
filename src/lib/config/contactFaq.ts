import { z } from 'zod';

export const contactFaqItemSchema = z.object({
    id: z.string().trim().min(1).max(100),
    question: z.string().trim().min(1, 'La pregunta es obligatoria').max(200),
    answer: z.string().trim().min(1, 'La respuesta es obligatoria').max(2000),
    isActive: z.boolean(),
    order: z.number().int().min(0),
});

export const contactFaqConfigSchema = z.object({
    enabled: z.boolean(),
    title: z.string().trim().min(1, 'El título es obligatorio').max(100),
    intro: z.string().trim().max(300),
    items: z.array(contactFaqItemSchema).max(50, 'Se permiten hasta 50 preguntas'),
}).superRefine((config, context) => {
    const ids = new Set<string>();

    config.items.forEach((item, index) => {
        if (ids.has(item.id)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items', index, 'id'],
                message: 'Cada pregunta debe tener un identificador único',
            });
        }
        ids.add(item.id);
    });
});

export type ContactFaqItem = z.infer<typeof contactFaqItemSchema>;
export type ContactFaqConfig = z.infer<typeof contactFaqConfigSchema>;

export const DEFAULT_CONTACT_FAQ: ContactFaqConfig = {
    enabled: true,
    title: 'Preguntas frecuentes',
    intro: '',
    items: [
        {
            id: 'pedido-minimo',
            question: '¿Cuál es el pedido mínimo?',
            answer: 'El pedido mínimo varía según el producto. Para chocolates personalizados, generalmente es de 10 a 50 unidades. Consultanos por WhatsApp para tu caso particular.',
            isActive: true,
            order: 1,
        },
        {
            id: 'tiempo-produccion',
            question: '¿Cuánto tardan en estar listos?',
            answer: 'El tiempo de producción es de 7 a 15 días hábiles dependiendo del producto y la cantidad. Para pedidos urgentes, contactanos por WhatsApp.',
            isActive: true,
            order: 2,
        },
        {
            id: 'envios',
            question: '¿Hacen envíos a todo el país?',
            answer: '¡Sí! Hacemos envíos a todo el país a través de correo y transporte. El costo del envío se calcula según la localidad y el peso del pedido.',
            isActive: true,
            order: 3,
        },
        {
            id: 'formas-pago',
            question: '¿Qué formas de pago aceptan?',
            answer: 'Aceptamos MercadoPago (tarjetas, efectivo) y transferencia bancaria. Pagando por transferencia tenés un 10% de descuento en el total.',
            isActive: true,
            order: 4,
        },
    ],
};
