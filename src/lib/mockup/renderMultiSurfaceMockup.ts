import createPerspectiveTransform from './perspectiveTransform';
import type { MockupTemplate, SurfaceConfig, DesignArea, Point2D } from '@/types/mockup';


interface RenderOptions {
    quality?: number;  // 1-10, default 5
    antiAlias?: boolean;
    blendMode?: GlobalCompositeOperation;
}

export function renderMultiSurfaceMockup(
    canvas: HTMLCanvasElement,
    mockupImage: HTMLImageElement,
    designImage: HTMLImageElement,
    template: MockupTemplate,
    globalTransform: { scale: number; rotation: number },
    options: RenderOptions = {}
) {
    const ctx = canvas.getContext('2d', {
        alpha: true,
        willReadFrequently: true
    });

    if (!ctx) return;

    // Configurar canvas
    canvas.width = mockupImage.width;
    canvas.height = mockupImage.height;

    // 1. Dibujar mockup base
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mockupImage, 0, 0);

    // 2. Ordenar superficies por zIndex
    const sortedSurfaces = [...template.surfaces]
        .filter(s => s.isActive)
        .sort((a, b) => a.zIndex - b.zIndex);

    // 3. Renderizar cada superficie
    for (const surface of sortedSurfaces) {
        renderSurface(
            ctx,
            designImage,
            surface,
            globalTransform,
            canvas.width,
            canvas.height,
            options
        );
    }
}

function renderSurface(
    ctx: CanvasRenderingContext2D,
    designImage: HTMLImageElement,
    surface: SurfaceConfig,
    globalTransform: { scale: number; rotation: number },
    canvasWidth: number,
    canvasHeight: number,
    options: RenderOptions
) {
    // 1. Extraer la porción del diseño para esta superficie
    const sourceCanvas = extractDesignPortion(
        designImage,
        surface.sourceArea,
        globalTransform
    );

    // 2. Aplicar transformación de perspectiva
    applyPerspectiveToSurface(
        ctx,
        sourceCanvas,
        surface.designArea,
        surface.transform || { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
        canvasWidth,
        canvasHeight,
        options
    );
}

function extractDesignPortion(
    designImage: HTMLImageElement,
    sourceArea: SurfaceConfig['sourceArea'],
    globalTransform: { scale: number; rotation: number }
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return canvas;

    if (!sourceArea) {
        // Si no hay área definida, usar toda la imagen
        canvas.width = designImage.width;
        canvas.height = designImage.height;
        ctx.drawImage(designImage, 0, 0);
        return canvas;
    }

    // Extraer porción específica
    canvas.width = sourceArea.width;
    canvas.height = sourceArea.height;

    ctx.drawImage(
        designImage,
        sourceArea.x, sourceArea.y,           // Posición origen
        sourceArea.width, sourceArea.height,   // Tamaño origen
        0, 0,                                  // Posición destino
        sourceArea.width, sourceArea.height    // Tamaño destino
    );

    // Aplicar transformación global
    if (globalTransform.scale !== 1 || globalTransform.rotation !== 0) {
        const transformedCanvas = document.createElement('canvas');
        const transformedCtx = transformedCanvas.getContext('2d');

        if (transformedCtx) {
            const scaledWidth = canvas.width * globalTransform.scale;
            const scaledHeight = canvas.height * globalTransform.scale;

            transformedCanvas.width = scaledWidth;
            transformedCanvas.height = scaledHeight;

            transformedCtx.save();
            transformedCtx.translate(scaledWidth / 2, scaledHeight / 2);
            transformedCtx.rotate((globalTransform.rotation * Math.PI) / 180);
            transformedCtx.scale(globalTransform.scale, globalTransform.scale);
            transformedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
            transformedCtx.restore();

            return transformedCanvas;
        }
    }

    return canvas;
}

function applyPerspectiveToSurface(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    designArea: DesignArea,
    surfaceTransform: { scale: number; rotation: number; offsetX: number; offsetY: number },
    canvasWidth: number,
    canvasHeight: number,
    options: RenderOptions
) {
    // Convertir puntos de porcentaje a píxeles
    const tl = percentToPixels(designArea.topLeft, canvasWidth, canvasHeight);
    const tr = percentToPixels(designArea.topRight, canvasWidth, canvasHeight);
    const br = percentToPixels(designArea.bottomRight, canvasWidth, canvasHeight);
    const bl = percentToPixels(designArea.bottomLeft, canvasWidth, canvasHeight);

    // Aplicar offset de superficie
    tl.x += surfaceTransform.offsetX;
    tl.y += surfaceTransform.offsetY;
    tr.x += surfaceTransform.offsetX;
    tr.y += surfaceTransform.offsetY;
    br.x += surfaceTransform.offsetX;
    br.y += surfaceTransform.offsetY;
    bl.x += surfaceTransform.offsetX;
    bl.y += surfaceTransform.offsetY;

    // Crear transformación de perspectiva
    // El source es el canvas extraído (rectangular)
    const srcCorners = [
        0, 0,
        sourceCanvas.width, 0,
        sourceCanvas.width, sourceCanvas.height,
        0, sourceCanvas.height
    ];

    // El destino son los puntos definidos por el usuario en el mockup
    const dstCorners = [
        tl.x, tl.y,
        tr.x, tr.y,
        br.x, br.y,
        bl.x, bl.y
    ];

    const perspT = createPerspectiveTransform(srcCorners, dstCorners);

    // Obtener datos de imagen fuente
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return;

    const sourceImageData = sourceCtx.getImageData(
        0, 0,
        sourceCanvas.width,
        sourceCanvas.height
    );

    // Calcular bounding box del área de destino
    const minX = Math.floor(Math.min(tl.x, tr.x, br.x, bl.x));
    const maxX = Math.ceil(Math.max(tl.x, tr.x, br.x, bl.x));
    const minY = Math.floor(Math.min(tl.y, tr.y, br.y, bl.y));
    const maxY = Math.ceil(Math.max(tl.y, tr.y, br.y, bl.y));

    // Asegurarse de que el bounding box esté dentro del canvas
    const renderMinX = Math.max(0, minX);
    const renderMinY = Math.max(0, minY);
    const renderMaxX = Math.min(canvasWidth, maxX);
    const renderMaxY = Math.min(canvasHeight, maxY);

    const resultWidth = renderMaxX - renderMinX;
    const resultHeight = renderMaxY - renderMinY;

    if (resultWidth <= 0 || resultHeight <= 0) return;

    // Obtenemos los datos actuales del canvas destino para poder mezclar (blending)
    const currentImageData = ctx.getImageData(renderMinX, renderMinY, resultWidth, resultHeight);
    const resultImageData = ctx.createImageData(resultWidth, resultHeight);

    // Aplicar transformación pixel por pixel (con optimización)
    const quality = options.quality || 5;
    const step = Math.max(1, Math.floor(10 / quality)); // Un step más bajo es mejor calidad

    // Copiamos los datos actuales al resultado inicialmente
    resultImageData.data.set(currentImageData.data);

    for (let y = 0; y < resultHeight; y += step) {
        for (let x = 0; x < resultWidth; x += step) {
            const globalX = x + renderMinX;
            const globalY = y + renderMinY;

            try {
                // Transformada Inversa: Dado un pixel en el destino (pantalla), ¿cuál es su origen en la textura?
                const srcPt = perspT.transformInverse(globalX, globalY);
                const srcX = srcPt.x;
                const srcY = srcPt.y;

                if (srcX >= 0 && srcX < sourceCanvas.width - 1 &&
                    srcY >= 0 && srcY < sourceCanvas.height - 1) {

                    let r, g, b, a;

                    // Si la calidad es alta (>5), usar Interpolación Bilineal
                    if (quality > 5) {
                        const x1 = Math.floor(srcX);
                        const y1 = Math.floor(srcY);
                        const x2 = Math.min(x1 + 1, sourceCanvas.width - 1);
                        const y2 = Math.min(y1 + 1, sourceCanvas.height - 1);

                        const dx = srcX - x1;
                        const dy = srcY - y1;

                        const w = sourceCanvas.width;
                        const idx11 = (y1 * w + x1) * 4;
                        const idx21 = (y1 * w + x2) * 4;
                        const idx12 = (y2 * w + x1) * 4;
                        const idx22 = (y2 * w + x2) * 4;

                        // Helper para interpolar un canal
                        const interp = (offset: number) => {
                            const val11 = sourceImageData.data[idx11 + offset];
                            const val21 = sourceImageData.data[idx21 + offset];
                            const val12 = sourceImageData.data[idx12 + offset];
                            const val22 = sourceImageData.data[idx22 + offset];

                            const top = val11 * (1 - dx) + val21 * dx;
                            const bottom = val12 * (1 - dx) + val22 * dx;
                            return top * (1 - dy) + bottom * dy;
                        };

                        r = interp(0);
                        g = interp(1);
                        b = interp(2);
                        a = interp(3) / 255;

                    } else {
                        // Nearest Neighbor (rápido)
                        const srcIdx = (Math.floor(srcY) * sourceCanvas.width + Math.floor(srcX)) * 4;
                        r = sourceImageData.data[srcIdx];
                        g = sourceImageData.data[srcIdx + 1];
                        b = sourceImageData.data[srcIdx + 2];
                        a = sourceImageData.data[srcIdx + 3] / 255;
                    }

                    const dstIdx = (y * resultWidth + x) * 4;
                    const dstAlpha = currentImageData.data[dstIdx + 3] / 255;

                    // Mezcla simple ALPHA
                    if (a > 0) {
                        // Result = Source * SourceAlpha + Dst * DstAlpha * (1 - SourceAlpha)
                        // Simplificación: Source Over
                        resultImageData.data[dstIdx] = r;
                        resultImageData.data[dstIdx + 1] = g;
                        resultImageData.data[dstIdx + 2] = b;
                        resultImageData.data[dstIdx + 3] = a * 255;
                    }

                    // Llenar píxeles saltados (si step > 1) para cubrir huecos por performance
                    if (step > 1) {
                        for (let dy = 0; dy < step; dy++) {
                            for (let dx = 0; dx < step; dx++) {
                                if (dy === 0 && dx === 0) continue;

                                const fillY = y + dy;
                                const fillX = x + dx;

                                if (fillY < resultHeight && fillX < resultWidth) {
                                    const fillIdx = (fillY * resultWidth + fillX) * 4;
                                    resultImageData.data[fillIdx] = resultImageData.data[dstIdx];
                                    resultImageData.data[fillIdx + 1] = resultImageData.data[dstIdx + 1];
                                    resultImageData.data[fillIdx + 2] = resultImageData.data[dstIdx + 2];
                                    resultImageData.data[fillIdx + 3] = resultImageData.data[dstIdx + 3];
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Punto fuera de la transformación
            }
        }
    }

    // Aplicar resultado al canvas principal
    ctx.putImageData(resultImageData, renderMinX, renderMinY);
}

function percentToPixels(
    point: Point2D,
    width: number,
    height: number
): { x: number; y: number } {
    return {
        x: (point.x / 100) * width,
        y: (point.y / 100) * height
    };
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
