import { PageBlockSchema } from '@/lib/blocks';
import type { PageBlock } from '@/lib/blocks';
import {
    clampNumber,
    sanitizeCssColor,
    sanitizePublicUrl,
    sanitizeRichText,
    sanitizeSvgIcon,
} from '@/lib/security/html';

const MAX_BLOCKS = 60;

export class PageContentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PageContentError';
    }
}

function text(value: string | undefined, maxLength: number): string | undefined {
    return value?.trim().slice(0, maxLength) || undefined;
}

export function sanitizePageBlocks(value: unknown): PageBlock[] {
    if (!Array.isArray(value) || value.length > MAX_BLOCKS) {
        throw new PageContentError(`La página puede contener hasta ${MAX_BLOCKS} bloques`);
    }

    return value.map((rawBlock, index) => {
        const result = PageBlockSchema.safeParse(rawBlock);
        if (!result.success) {
            throw new PageContentError(`El bloque ${index + 1} no es válido`);
        }

        const block = result.data;
        switch (block.type) {
            case 'hero':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: block.props.title.slice(0, 500),
                        subtitle: text(block.props.subtitle, 2_000),
                        backgroundImage: sanitizePublicUrl(block.props.backgroundImage) || undefined,
                        overlayOpacity: clampNumber(block.props.overlayOpacity, 50, 0, 100),
                        ctaText: text(block.props.ctaText, 100),
                        ctaLink: sanitizePublicUrl(block.props.ctaLink) || undefined,
                        minHeight: clampNumber(block.props.minHeight, 500, 200, 1_200),
                    },
                };
            case 'richtext':
                return { ...block, props: { ...block.props, content: sanitizeRichText(block.props.content) } };
            case 'image_text':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        content: sanitizeRichText(block.props.content),
                        image: sanitizePublicUrl(block.props.image),
                        ctaText: text(block.props.ctaText, 100),
                        ctaLink: sanitizePublicUrl(block.props.ctaLink) || undefined,
                        backgroundColor: sanitizeCssColor(block.props.backgroundColor, '#ffffff'),
                    },
                };
            case 'features':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        subtitle: text(block.props.subtitle, 1_000),
                        backgroundColor: sanitizeCssColor(block.props.backgroundColor, '#f9fafb'),
                        features: block.props.features?.slice(0, 16).map((feature) => ({
                            title: feature.title.slice(0, 200),
                            description: feature.description.slice(0, 2_000),
                            icon: sanitizeSvgIcon(feature.icon) || undefined,
                            image: sanitizePublicUrl(feature.image) || undefined,
                        })),
                    },
                };
            case 'faq':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        subtitle: text(block.props.subtitle, 1_000),
                        items: block.props.items?.slice(0, 50).map((item) => ({
                            question: item.question.slice(0, 500),
                            answer: sanitizeRichText(item.answer),
                        })),
                    },
                };
            case 'product_grid':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        subtitle: text(block.props.subtitle, 1_000),
                        categoryIds: block.props.categoryIds?.filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 30),
                        limit: Math.round(clampNumber(block.props.limit, 4, 1, 24)),
                        ctaText: text(block.props.ctaText, 100),
                        ctaLink: sanitizePublicUrl(block.props.ctaLink) || undefined,
                    },
                };
            case 'testimonials':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        subtitle: text(block.props.subtitle, 1_000),
                        backgroundColor: sanitizeCssColor(block.props.backgroundColor, '#ffffff'),
                        testimonials: block.props.testimonials?.slice(0, 30).map((testimonial) => ({
                            name: testimonial.name.slice(0, 200),
                            role: text(testimonial.role, 200),
                            content: testimonial.content.slice(0, 3_000),
                            image: sanitizePublicUrl(testimonial.image) || undefined,
                            rating: Math.round(clampNumber(testimonial.rating, 5, 1, 5)),
                        })),
                    },
                };
            case 'whatsapp_cta':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        phoneNumber: block.props.phoneNumber?.replace(/\D/g, '').slice(0, 20),
                        message: text(block.props.message, 2_000),
                        buttonText: text(block.props.buttonText, 100),
                        backgroundColor: sanitizeCssColor(block.props.backgroundColor, '#f9fafb'),
                    },
                };
            case 'contact_form':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        title: text(block.props.title, 300),
                        subtitle: text(block.props.subtitle, 1_000),
                        emailTo: block.props.emailTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(block.props.emailTo)
                            ? block.props.emailTo.slice(0, 254)
                            : undefined,
                        backgroundColor: sanitizeCssColor(block.props.backgroundColor, '#ffffff'),
                    },
                };
            case 'spacer':
                return {
                    ...block,
                    props: {
                        ...block.props,
                        height: clampNumber(block.props.height, 50, 0, 1_000),
                        lineColor: sanitizeCssColor(block.props.lineColor, '#EBE5DB'),
                    },
                };
        }
    });
}

export function safelySanitizePageBlocks(value: unknown): PageBlock[] {
    try {
        return sanitizePageBlocks(value);
    } catch (error) {
        console.error('Contenido de página inválido:', error);
        return [];
    }
}
