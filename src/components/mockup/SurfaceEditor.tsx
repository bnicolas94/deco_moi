import React, { useRef, useEffect, useState } from 'react';
import type { SurfaceConfig, DesignArea, Point2D } from '@/types/mockup';

interface SurfaceEditorProps {
    mockupImage: HTMLImageElement | null;
    surface: SurfaceConfig;
    onPointsUpdate: (surfaceId: string, points: DesignArea) => void;
}

export function SurfaceEditor({
    mockupImage,
    surface,
    onPointsUpdate
}: SurfaceEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [draggingPoint, setDraggingPoint] = useState<keyof DesignArea | null>(null);
    const [points, setPoints] = useState<DesignArea>(surface.designArea);

    // Sincronizar estado local si cambia la prop
    useEffect(() => {
        setPoints(surface.designArea);
    }, [surface.designArea]);

    useEffect(() => {
        if (!canvasRef.current || !mockupImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ajustar canvas al mockup
        // Usamos el tamaño natural de la imagen para precisión, pero CSS lo escala
        canvas.width = mockupImage.width;
        canvas.height = mockupImage.height;

        // Dibujar mockup
        ctx.drawImage(mockupImage, 0, 0);

        // Dibujar puntos y líneas
        drawSurfaceOverlay(ctx, points, canvas.width, canvas.height);
    }, [mockupImage, points]);

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const { x, y } = getCanvasCoordinates(e);
        const pctX = (x / canvasRef.current.width) * 100;
        const pctY = (y / canvasRef.current.height) * 100;

        // Detectar qué punto está siendo arrastrado
        const pointKey = detectNearestPoint(pctX, pctY, points);
        if (pointKey) {
            setDraggingPoint(pointKey);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingPoint || !canvasRef.current) return;

        const { x, y } = getCanvasCoordinates(e);

        // Clamp values to cancel borders
        const safeX = Math.max(0, Math.min(canvasRef.current.width, x));
        const safeY = Math.max(0, Math.min(canvasRef.current.height, y));

        const pctX = (safeX / canvasRef.current.width) * 100;
        const pctY = (safeY / canvasRef.current.height) * 100;

        const newPoints = {
            ...points,
            [draggingPoint]: { x: pctX, y: pctY }
        };

        setPoints(newPoints);
        onPointsUpdate(surface.id, newPoints);
    };

    const handleMouseUp = () => {
        setDraggingPoint(null);
    };

    return (
        <div className="surface-editor relative border rounded overflow-hidden">
            {mockupImage ? (
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="max-w-full h-auto touch-none"
                    style={{
                        cursor: draggingPoint ? 'grabbing' : 'grab',
                    }}
                />
            ) : (
                <div className="bg-gray-100 p-8 text-center text-gray-500">
                    Sube una imagen base primero
                </div>
            )}

            <div className="p-4 bg-gray-50 border-t">
                <p className="text-sm font-medium mb-2">Coordenadas (Top-Left, Top-Right, Bottom-Right, Bottom-Left):</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(points).map(([key, point]) => (
                        <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span>{point.x.toFixed(1)}%, {point.y.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Helpers
function drawSurfaceOverlay(
    ctx: CanvasRenderingContext2D,
    points: DesignArea,
    width: number,
    height: number
) {
    const tl = { x: (points.topLeft.x / 100) * width, y: (points.topLeft.y / 100) * height };
    const tr = { x: (points.topRight.x / 100) * width, y: (points.topRight.y / 100) * height };
    const br = { x: (points.bottomRight.x / 100) * width, y: (points.bottomRight.y / 100) * height };
    const bl = { x: (points.bottomLeft.x / 100) * width, y: (points.bottomLeft.y / 100) * height };

    ctx.save();

    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();

    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();

    // Draw handles
    const drawHandle = (x: number, y: number, color: string = '#3b82f6') => {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2); // Radio en pixeles reales
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    drawHandle(tl.x, tl.y);
    drawHandle(tr.x, tr.y);
    drawHandle(br.x, br.y);
    drawHandle(bl.x, bl.y);

    ctx.restore();
}

function detectNearestPoint(x: number, y: number, points: DesignArea): keyof DesignArea | null {
    const threshold = 5; // Porcentaje de tolerancia (ajustar según usabilidad)

    const dist = (p1: { x: number, y: number }, p2: { x: number, y: number }) =>
        Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    let minDistance = Infinity;
    let nearest: keyof DesignArea | null = null;

    (Object.keys(points) as Array<keyof DesignArea>).forEach(key => {
        const d = dist({ x, y }, points[key]);
        if (d < minDistance) {
            minDistance = d;
            nearest = key;
        }
    });

    return minDistance < threshold ? nearest : null;
}
