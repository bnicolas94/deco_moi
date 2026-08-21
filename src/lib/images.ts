export const RESPONSIVE_IMAGE_WIDTHS = [160, 320, 480, 640, 960, 1280, 1600] as const;

type ResponsiveImageWidth = (typeof RESPONSIVE_IMAGE_WIDTHS)[number];

function getUploadRelativePath(source: string | null | undefined): string | null {
    if (!source || !source.startsWith('/uploads/') || /\.gif(?:$|\?)/i.test(source)) return null;

    const path = source.slice('/uploads/'.length).split('?')[0];
    if (!/^(products|categories|mockups)\/[a-z0-9._/-]+$/i.test(path)) return null;
    return path;
}

export function optimizedImageUrl(
    source: string | null | undefined,
    width: ResponsiveImageWidth,
): string {
    const relativePath = getUploadRelativePath(source);
    return relativePath ? `/media/${relativePath}?w=${width}` : (source || '');
}

export function responsiveImageSrcSet(
    source: string | null | undefined,
    widths: readonly ResponsiveImageWidth[],
): string | undefined {
    if (!getUploadRelativePath(source)) return undefined;
    return widths.map((width) => `${optimizedImageUrl(source, width)} ${width}w`).join(', ');
}
