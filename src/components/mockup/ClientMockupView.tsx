import React, { useEffect } from 'react';
import { DesignUploader } from './DesignUploader';
import { renderMultiSurfaceMockup } from '@/lib/mockup/renderMultiSurfaceMockup';
import type { MockupTemplate } from '@/types/mockup';
import { Download, RotateCw, ZoomIn } from 'lucide-react';

interface ClientMockupViewProps {
    mockupImage: HTMLImageElement | null;
    designImage: HTMLImageElement | null;
    template: MockupTemplate | null;
    globalTransform: { scale: number; rotation: number };
    onDesignUpload: (file: File) => void;
    onTransformChange: (transform: { scale: number; rotation: number }) => void;
    onExport: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;

    productName: string;
}

export function ClientMockupView({
    mockupImage,
    designImage,
    template,
    globalTransform,
    onDesignUpload,
    onTransformChange,
    onExport,
    canvasRef,
    productName
}: ClientMockupViewProps) {

    useEffect(() => {
        if (canvasRef.current && mockupImage && designImage && template) {
            renderMultiSurfaceMockup(
                canvasRef.current,
                mockupImage,
                designImage,
                template,
                globalTransform,
                { quality: 10 }
            );
        } else if (canvasRef.current && mockupImage) {
            // Draw just the mockup base if no design
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                canvasRef.current.width = mockupImage.width;
                canvasRef.current.height = mockupImage.height;
                ctx.drawImage(mockupImage, 0, 0);
            }
        }
    }, [mockupImage, designImage, template, globalTransform]);

    const handleDesignFile = (url: string) => {
        fetch(url).then(r => r.blob()).then(blob => {
            const file = new File([blob], "design.png", { type: blob.type });
            onDesignUpload(file);
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Personaliza tu {productName}</h2>
                <p className="text-gray-500 text-sm">Sube tu diseño y ajusta cómo se ve en el producto real.</p>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Controls Area */}
                <div className="w-full md:w-1/3 p-6 bg-gray-50 space-y-8">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3">1. Sube tu diseño</h3>
                        <DesignUploader
                            onUpload={handleDesignFile}
                            className="bg-white shadow-sm"
                        />
                    </div>

                    <div className={!designImage ? 'opacity-50 pointer-events-none' : ''}>
                        <h3 className="font-semibold text-gray-700 mb-3">2. Ajusta la posición</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <ZoomIn className="w-4 h-4" /> Escala ({Math.round(globalTransform.scale * 100)}%)
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.05"
                                    value={globalTransform.scale}
                                    onChange={(e) => onTransformChange({ ...globalTransform, scale: parseFloat(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <RotateCw className="w-4 h-4" /> Rotación ({Math.round(globalTransform.rotation)}°)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    step="1"
                                    value={globalTransform.rotation}
                                    onChange={(e) => onTransformChange({ ...globalTransform, rotation: parseFloat(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={onExport}
                            disabled={!designImage}
                            className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${designImage
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <Download className="w-5 h-5" /> Descargar Resultado
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="w-full md:w-2/3 p-6 bg-gray-100 flex items-center justify-center min-h-[400px]">
                    {mockupImage ? (
                        <div className="relative shadow-2xl rounded-lg overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                className="max-w-full max-h-[600px] w-auto h-auto block bg-white"
                            />
                            {!designImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
                                    <div className="bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-600 shadow-sm backdrop-blur">
                                        Vista previa del producto
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <div className="animate-pulse bg-gray-200 w-64 h-64 rounded-xl mx-auto mb-4"></div>
                            <p>Cargando modelo del producto...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
