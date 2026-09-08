import { sanitizeCssColor, sanitizePublicUrl } from '@/lib/security/html';

const text = (value: unknown, maxLength: number, fallback = '') =>
    typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback;

const boolean = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback;

export function sanitizeHomeBlockSettings(type: string, value: unknown): Record<string, unknown> {
    const settings = value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};

    if (type !== 'categories') return settings;

    const rawCards = Array.isArray(settings.cards) ? settings.cards.slice(0, 6) : [];
    const cards = rawCards
        .filter((card): card is Record<string, unknown> => Boolean(card) && typeof card === 'object' && !Array.isArray(card))
        .map((card, index) => ({
            id: text(card.id, 80, `card-${index}`).replace(/[^a-z0-9_-]/gi, '-') || `card-${index}`,
            title: text(card.title, 100),
            description: text(card.description, 220),
            image: sanitizePublicUrl(card.image),
            link: sanitizePublicUrl(card.link, '/productos'),
            buttonText: text(card.buttonText, 60, 'Ver opciones'),
            isActive: boolean(card.isActive, true),
            newTab: boolean(card.newTab, false),
        }));

    return {
        title: text(settings.title, 140, 'Un detalle para cada momento'),
        subtitle: text(settings.subtitle, 300, 'Elegí la ocasión y encontrá un regalo hecho para emocionar.'),
        backgroundColor: sanitizeCssColor(settings.backgroundColor, '#ffffff'),
        buttonText: text(settings.buttonText, 60),
        buttonLink: sanitizePublicUrl(settings.buttonLink, '/productos'),
        cards,
    };
}
