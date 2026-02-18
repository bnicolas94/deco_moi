import React, { useRef, useEffect, useState } from 'react';
import type { PerspectiveConfig, Point, Surface } from '@/types/mockup';
import { Trash2, Plus, Edit2, Layers } from 'lucide-react';

interface PerspectiveEditorProps {
    baseImage: string | null;
    surfaces: Surface[];
    activeSurfaceId: string | null;
    onSurfaceChange: (id: string, points: PerspectiveConfig) => void;
    onSurfaceSelect: (id: string) => void;
    onSurfaceAdd: (name: string) => void;
    onSurfaceRemove: (id: string) => void;
    onSurfaceNameChange: (id: string, name: string) => void;
}

export const PerspectiveEditor: React.FC<PerspectiveEditorProps> = ({
    baseImage,
    surfaces,
    activeSurfaceId,
    onSurfaceChange,
    onSurfaceSelect,
    onSurfaceAdd,
    onSurfaceRemove,
    onSurfaceNameChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingPoint, setDraggingPoint] = useState<keyof PerspectiveConfig | null>(null);
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [newSurfaceName, setNewSurfaceName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Cargar imagen
    useEffect(() => {
        if (!baseImage) return;
        const image = new Image();
        image.src = baseImage;
        image.onload = () => setImg(image);
    }, [baseImage]);

    // Dibujar
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const containerWidth = containerRef.current?.clientWidth || 600;
        const displayWidth = Math.min(containerWidth, img.width);
        const displayHeight = (img.height / img.width) * displayWidth;

        if (Math.abs(canvas.width - displayWidth) > 1 || Math.abs(canvas.height - displayHeight) > 1) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Helper functions
        const x = (pct: number) => (pct / 100) * canvas.width;
        const y = (pct: number) => (pct / 100) * canvas.height;

        const drawSurface = (surface: Surface, isActive: boolean) => {
            const { points } = surface;

            ctx.beginPath();
            ctx.moveTo(x(points.topLeft.x), y(points.topLeft.y));
            ctx.lineTo(x(points.topRight.x), y(points.topRight.y));
            ctx.lineTo(x(points.bottomRight.x), y(points.bottomRight.y));
            ctx.lineTo(x(points.bottomLeft.x), y(points.bottomLeft.y));
            ctx.closePath();

            ctx.strokeStyle = isActive ? '#00ff00' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.setLineDash(isActive ? [5, 5] : []);
            ctx.stroke();
            ctx.setLineDash([]);

            if (isActive) {
                // Rellenar ligeramente para identificar
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.fill();

                drawPoint(ctx, points.topLeft, x, y);
                drawPoint(ctx, points.topRight, x, y);
                drawPoint(ctx, points.bottomRight, x, y);
                drawPoint(ctx, points.bottomLeft, x, y);
            } else {
                // Nombre de la superficie inactiva
                const centerX = (points.topLeft.x + points.bottomRight.x) / 2;
                const centerY = (points.topLeft.y + points.bottomRight.y) / 2;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(x(centerX) - 30, y(centerY) - 10, 60, 20);
                ctx.fillStyle = 'white';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(surface.name, x(centerX), y(centerY) + 3);
            }
        };

        // Dibujar superficies inactivas primero
        surfaces.forEach(s => {
            if (s.id !== activeSurfaceId) drawSurface(s, false);
        });

        // Dibujar superficie activa encima
        const activeSurface = surfaces.find(s => s.id === activeSurfaceId);
        if (activeSurface) {
            drawSurface(activeSurface, true);
        }

    }, [img, surfaces, activeSurfaceId, containerRef.current?.clientWidth]);

    function drawPoint(ctx: CanvasRenderingContext2D, point: Point, xFn: (p: number) => number, yFn: (p: number) => number) {
        const px = xFn(point.x);
        const py = yFn(point.y);

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
    }

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100
        };
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!activSurfaceId) return;
        const activeSurface = surfaces.find(s => s.id === activeSurfaceId);
        if (!activeSurface) return;

        const { x, y } = getMousePos(e);
        const points = activeSurface.points;
        const keys: (keyof PerspectiveConfig)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];

        let closestKey: keyof PerspectiveConfig | null = null;
        let minDist = Infinity;

        for (const key of keys) {
            const p = points[key];
            const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
            if (dist < 5 && dist < minDist) {
                closestKey = key;
                minDist = dist;
            }
        }

        if (closestKey) {
            setDraggingPoint(closestKey);
            e.preventDefault();
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!draggingPoint || !activeSurfaceId) return;
        e.preventDefault();

        const activeSurface = surfaces.find(s => s.id === activeSurfaceId);
        if (!activeSurface) return;

        const { x, y } = getMousePos(e);
        const newX = Math.max(0, Math.min(100, x));
        const newY = Math.max(0, Math.min(100, y));

        onSurfaceChange(activeSurfaceId, {
            ...activeSurface.points,
            [draggingPoint]: { x: newX, y: newY }
        });
    };

    const handleEnd = () => setDraggingPoint(null);
    const activSurfaceId = activeSurfaceId; // Alias for closure clarity

    const handleAddSurface = () => {
        if (newSurfaceName.trim()) {
            onSurfaceAdd(newSurfaceName.trim());
            setNewSurfaceName('');
            setIsAdding(false);
        }
    };

    if (!baseImage) {
        return (
            <div className="w-full h-64 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                Sube una imagen base primero
            </div>
        );
    }

    return (
        <div className="flex gap-6">
            <div ref={containerRef} className="flex-1 select-none relative">
                <canvas
                    ref={canvasRef}
                    className="rounded shadow-sm touch-none cursor-crosshair w-full"
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                />
            </div>

            <div className="w-64 flex flex-col gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Layers size={18} /> Superficies
                    </h3>

                    <div className="space-y-2 mb-4">
                        {surfaces.map(surface => (
                            <div
                                key={surface.id}
                                onClick={() => onSurfaceSelect(surface.id)}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${surface.id === activeSurfaceId
                                        ? 'bg-indigo-50 border border-indigo-200'
                                        : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                <span className="text-sm font-medium text-gray-700">{surface.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSurfaceRemove(surface.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {isAdding ? (
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Nombre (ej. Lateral)"
                                className="text-sm border rounded px-2 py-1 w-full"
                                value={newSurfaceName}
                                onChange={e => setNewSurfaceName(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddSurface()}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddSurface}
                                    className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded hover:bg-indigo-700"
                                >
                                    Aceptar
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 text-xs py-1 rounded hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 border border-indigo-200 rounded py-2 hover:bg-indigo-50"
                        >
                            <Plus size={16} /> Nueva Superficie
                        </button>
                    )}
                </div>

                <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                    <p>Selecciona una superficie para editar sus puntos. Puedes crear tantas como necesites (Tapa, Laterales, etc).</p>
                </div>
            </div>
        </div>
    );
};
