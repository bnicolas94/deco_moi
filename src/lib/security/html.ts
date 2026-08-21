import sanitizeHtml from 'sanitize-html';

const MAX_HTML_LENGTH = 100_000;
const SAFE_COLOR_VALUE = /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%+-]+\)|[a-z]{1,24})$/i;
const SAFE_FONT_SIZE = /^(?:1[0-9]|2[0-9]|3[0-9]|4[0-8])px$/;
const SAFE_TEXT_ALIGN = /^(?:left|right|center|justify)$/;
const NON_TEXT_TAGS = [
    'script',
    'style',
    'textarea',
    'option',
    'xmp',
    'noembed',
    'noframes',
    'iframe',
    'template',
];

function boundedHtml(value: unknown): string {
    return typeof value === 'string' ? value.slice(0, MAX_HTML_LENGTH) : '';
}

export function sanitizeRichText(value: unknown): string {
    return sanitizeHtml(boundedHtml(value), {
        allowedTags: [
            'p', 'br', 'h1', 'h2', 'h3', 'h4',
            'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'span',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'hr',
        ],
        allowedAttributes: {
            a: ['href', 'target', 'rel', 'class'],
            span: ['style'],
            mark: ['style', 'data-color'],
            p: ['style'],
            h1: ['style'],
            h2: ['style'],
            h3: ['style'],
            h4: ['style'],
        },
        allowedClasses: {
            a: ['text-indigo-600', 'underline', 'cursor-pointer'],
        },
        allowedStyles: {
            '*': {
                color: [SAFE_COLOR_VALUE],
                'background-color': [SAFE_COLOR_VALUE],
                'font-size': [SAFE_FONT_SIZE],
                'text-align': [SAFE_TEXT_ALIGN],
            },
        },
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        allowProtocolRelative: false,
        allowedSchemesAppliedToAttributes: ['href'],
        nestingLimit: 20,
        nonTextTags: NON_TEXT_TAGS,
        disallowedTagsMode: 'discard',
        transformTags: {
            a: (tagName, attribs) => ({
                tagName,
                attribs: {
                    ...attribs,
                    ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
                },
            }),
        },
    });
}

export function sanitizeInlineMarkup(value: unknown): string {
    return sanitizeHtml(boundedHtml(value), {
        allowedTags: ['span', 'strong', 'b', 'em', 'i', 'u', 'mark', 'br'],
        allowedAttributes: {
            span: ['class'],
            mark: ['class'],
        },
        allowedClasses: {
            span: ['text-gradient-gold'],
            mark: [],
        },
        allowedSchemes: [],
        nestingLimit: 10,
        nonTextTags: NON_TEXT_TAGS,
        disallowedTagsMode: 'discard',
    });
}

export function sanitizeSvgIcon(value: unknown): string {
    return sanitizeHtml(boundedHtml(value), {
        allowedTags: ['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'],
        allowedAttributes: {
            svg: ['viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'aria-hidden', 'role'],
            g: ['fill', 'stroke', 'stroke-width', 'transform'],
            path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'transform'],
            circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
            rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
            line: ['x1', 'x2', 'y1', 'y2', 'stroke', 'stroke-width', 'stroke-linecap'],
            polyline: ['points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
            polygon: ['points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
            ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
        },
        allowedSchemes: [],
        nestingLimit: 12,
        nonTextTags: NON_TEXT_TAGS,
        disallowedTagsMode: 'completelyDiscard',
    });
}

export function sanitizeCssColor(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const candidate = value.trim();
    return candidate.length <= 64 && SAFE_COLOR_VALUE.test(candidate) ? candidate : fallback;
}

export function sanitizePublicUrl(value: unknown, fallback = ''): string {
    if (typeof value !== 'string') return fallback;
    const candidate = value.trim();
    if (!candidate || candidate.length > 2_000 || /[\u0000-\u001f\\]/.test(candidate)) return fallback;

    if (candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }

    try {
        const parsed = new URL(candidate);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : fallback;
    } catch {
        return fallback;
    }
}

export function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
