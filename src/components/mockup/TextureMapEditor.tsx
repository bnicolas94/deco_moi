import React, { useRef, useEffect, useState } from 'react';
import type { SurfaceConfig } from '@/types/mockup';

interface TextureMapEditorProps {
    designImage: HTMLImageElement;
    surface: SurfaceConfig;
    onSourceAreaChange: (area: { x: number; y: number; width: number; height: number }) => void;
}

export function TextureMapEditor({ designImage, surface, onSourceAreaChange }: TextureMapEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<'move' | 'resize-br' | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [initialArea, setInitialArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Initialize source area if missing or strictly valid
    useEffect(() => {
        if (!surface.sourceArea || surface.sourceArea.width === 0) {
            // Default to full image if not set, or a reasonable center box
            const defaultWidth = designImage.width * 0.5;
            const defaultHeight = designImage.height * 0.5;
            onSourceAreaChange({
                x: (designImage.width - defaultWidth) / 2,
                y: (designImage.height - defaultHeight) / 2,
                width: defaultWidth,
                height: defaultHeight
            });
        }
    }, [surface.id, designImage]);

    // Draw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fit canvas to container but keep aspect ratio
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const scale = Math.min(containerWidth / designImage.width, 1);

        canvas.width = designImage.width * scale;
        canvas.height = designImage.height * scale;

        // Draw image
        ctx.drawImage(designImage, 0, 0, canvas.width, canvas.height);

        // Draw current source area
        if (surface.sourceArea) {
            const { x, y, width, height } = surface.sourceArea;

            // Scaled coordinates
            const sx = x * scale;
            const sy = y * scale;
            const sw = width * scale;
            const sh = height * scale;

            // Mask darkening outside selection
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.clearRect(sx, sy, sw, sh); // Clear rectangle

            // Draw border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, sw, sh);

            // Draw content again inside to have it bright
            ctx.drawImage(designImage, x, y, width, height, sx, sy, sw, sh);

            // Draw resize handle (bottom right)
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(sx + sw - 6, sy + sh - 6, 12, 12);
        }

    }, [designImage, surface.sourceArea]);

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const scale = Math.min(containerWidth / designImage.width, 1);

        // Position relative to image-space (unscaled)
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!surface.sourceArea) return;

        const pos = getMousePos(e);
        const { x, y, width, height } = surface.sourceArea;
        const handleSize = 20; // larger hit area logic

        // Check if handle clicked
        if (
            Math.abs(pos.x - (x + width)) < handleSize &&
            Math.abs(pos.y - (y + height)) < handleSize
        ) {
            setDragMode('resize-br');
            setIsDragging(true);
            setStartPos(pos);
            setInitialArea(surface.sourceArea);
            return;
        }

        // Check if inside rect
        if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
            setDragMode('move');
            setIsDragging(true);
            setStartPos(pos);
            setInitialArea(surface.sourceArea);
            return;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragMode) {
            // Cursor update logic could go here
            return;
        }

        const pos = getMousePos(e);
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        if (dragMode === 'move') {
            let newX = initialArea.x + dx;
            let newY = initialArea.y + dy;

            // Constraints
            newX = Math.max(0, Math.min(newX, designImage.width - initialArea.width));
            newY = Math.max(0, Math.min(newY, designImage.height - initialArea.height));

            onSourceAreaChange({
                ...initialArea,
                x: newX,
                y: newY
            });
        } else if (dragMode === 'resize-br') {
            let newW = initialArea.width + dx;
            let newH = initialArea.height + dy;

            // Constraints
            newW = Math.max(10, Math.min(newW, designImage.width - initialArea.x));
            newH = Math.max(10, Math.min(newH, designImage.height - initialArea.y));

            onSourceAreaChange({
                ...initialArea,
                width: newW,
                height: newH
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragMode(null);
    };

    return (
        <div className="relative w-full flex justify-center bg-gray-900 rounded p-2 overflow-hidden">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-crosshair shadow-lg"
            />
            <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded pointer-events-none">
                Arrastra el recuadro para seleccionar el área. Usa la esquina inferior derecha para redimensionar.
            </div>
        </div>
    );
}
