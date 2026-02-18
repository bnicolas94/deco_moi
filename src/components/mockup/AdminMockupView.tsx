import React, { useState, useRef, useEffect } from 'react';
import { SurfaceEditor } from './SurfaceEditor';
import { TextureMapEditor } from './TextureMapEditor';
import { DesignUploader } from './DesignUploader';
import { renderMultiSurfaceMockup, loadImage } from '@/lib/mockup/renderMultiSurfaceMockup';
import type { MockupTemplate, DesignArea, SurfaceConfig } from '@/types/mockup';
import { Save, Plus, Trash2, Layout } from 'lucide-react';

interface AdminMockupViewProps {
    mockupImage: HTMLImageElement | null;
    designImage: HTMLImageElement | null;
    template: MockupTemplate | null;
    activeSurfaceId: string;
    globalTransform: { scale: number; rotation: number };
    onMockupUpload: (file: File) => void;
    onDesignUpload: (file: File) => void;
    onActiveSurfaceChange: (id: string) => void;
    onSurfacePointsUpdate: (surfaceId: string, points: DesignArea) => void;
    onSourceAreaUpdate: (surfaceId: string, sourceArea: any) => void;
    onTransformChange: (transform: { scale: number; rotation: number }) => void;
    onSaveTemplate: () => void;
    onExport: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;

    setTemplate: (template: MockupTemplate) => void;
}

export function AdminMockupView({
    mockupImage,
    designImage,
    template,
    activeSurfaceId,
    globalTransform,
    onMockupUpload,
    onDesignUpload,
    onActiveSurfaceChange,
    onSurfacePointsUpdate,
    onSourceAreaUpdate,
    onTransformChange,
    onSaveTemplate,
    onExport,
    canvasRef,
    setTemplate
}: AdminMockupViewProps) {
    // Modes: 'points' (3D surface), 'texture' (2D source), 'preview' (Final result)
    const [editorMode, setEditorMode] = useState<'points' | 'texture' | 'preview'>('points');
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Cargar productos al montar
    useEffect(() => {
        fetch('/api/mockup/templates')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data);
                }
            })
            .catch(err => console.error("Error loading products:", err));
    }, []);

    const handleMockupFile = (url: string) => {
        fetch(url).then(r => r.blob()).then(blob => {
            const file = new File([blob], "mockup.png", { type: blob.type });
            onMockupUpload(file);
        });
    };

    const handleDesignFile = (url: string) => {
        fetch(url).then(r => r.blob()).then(blob => {
            const file = new File([blob], "design.png", { type: blob.type });
            onDesignUpload(file);
        });
    };

    const handleSave = async () => {
        if (!selectedProductId) {
            alert('Por favor selecciona un producto primero.');
            return;
        }
        if (!mockupImage || !template) {
            alert('Faltan datos del template o imagen.');
            return;
        }

        setIsSaving(true);
        try {
            // Convertir imagen base a archivo para subir
            // Asumimos que mockupImage.src es una blob url válida creada localmente
            const response = await fetch(mockupImage.src);
            const blob = await response.blob();
            const file = new File([blob], "mockup-base.png", { type: 'image/png' });

            const formData = new FormData();
            formData.append('productId', selectedProductId);
            formData.append('name', template.name);
            formData.append('surfaces', JSON.stringify(template.surfaces));
            formData.append('defaultTransform', JSON.stringify(template.defaultTransform));
            formData.append('mockupImage', file);

            const res = await fetch('/api/mockup/templates', {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (result.success) {
                alert('¡Template guardado correctamente! Ahora puedes verlo en la página del producto.');
            } else {
                alert('Error al guardar: ' + result.error);
            }

        } catch (e: any) {
            console.error(e);
            alert('Error al guardar: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const addSurface = () => {
        if (!template) return;
        const newSurface: SurfaceConfig = {
            id: `surface-${Date.now()}`,
            name: `Superficie ${template.surfaces.length + 1}`,
            designArea: {
                topLeft: { x: 10, y: 10 },
                topRight: { x: 40, y: 10 },
                bottomRight: { x: 40, y: 40 },
                bottomLeft: { x: 10, y: 40 }
            },
            isActive: true,
            zIndex: template.surfaces.length + 1
        };
        setTemplate({
            ...template,
            surfaces: [...template.surfaces, newSurface]
        });
        onActiveSurfaceChange(newSurface.id);
    };

    const activeSurface = template?.surfaces.find(s => s.id === activeSurfaceId);

    // Initial render effect for preview
    useEffect(() => {
        if (editorMode === 'preview' && canvasRef.current && mockupImage && designImage && template) {
            renderMultiSurfaceMockup(
                canvasRef.current,
                mockupImage,
                designImage,
                template,
                globalTransform,
                { quality: 10 } // High quality for preview
            );
        }
    }, [editorMode, mockupImage, designImage, template, globalTransform]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-white p-4 rounded-lg shadow space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Layout className="w-5 h-5" /> Configuración Base
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">Asignar a Producto</label>
                        <select
                            className="w-full p-2 border rounded bg-gray-50"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                        >
                            <option value="">-- Seleccionar Producto --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.hasTemplate ? '(Con Template)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mockup Base (Producto 3D)</label>
                        <DesignUploader onUpload={handleMockupFile} label="Subir imagen producto" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Diseño de Prueba</label>
                        <DesignUploader onUpload={handleDesignFile} label="Subir patrón/diseño" />
                    </div>
                </div>

                {template && (
                    <div className="bg-white p-4 rounded-lg shadow space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Superficies</h3>
                            <button
                                onClick={addSurface}
                                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {template.surfaces.map(surface => (
                                <div
                                    key={surface.id}
                                    onClick={() => onActiveSurfaceChange(surface.id)}
                                    className={`p-3 rounded border cursor-pointer flex justify-between items-center ${activeSurfaceId === surface.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="font-medium">{surface.name}</span>
                                    <span className="text-xs text-gray-400">z: {surface.zIndex}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEditorMode('points')}
                            className={`flex-1 py-2 px-2 text-sm rounded font-medium transition-colors ${editorMode === 'points'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                        >
                            1. Puntos 3D
                        </button>
                        <button
                            onClick={() => setEditorMode('texture')}
                            className={`flex-1 py-2 px-2 text-sm rounded font-medium transition-colors ${editorMode === 'texture'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                        >
                            2. Mapeo Textura
                        </button>
                    </div>

                    <button
                        onClick={() => setEditorMode(editorMode === 'preview' ? 'points' : 'preview')}
                        className={`w-full py-2 px-4 rounded font-medium transition-colors ${editorMode === 'preview'
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                    >
                        {editorMode === 'preview' ? 'Volver a Editar' : '3. Vista Previa'}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-2 px-4 rounded font-medium flex items-center justify-center gap-2 mt-2 ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar y Asignar'}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className={`w-full lg:w-2/3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] flex items-center justify-center p-4 relative overflow-hidden ${editorMode === 'texture' ? 'bg-gray-800' : ''}`}>
                {!mockupImage && editorMode !== 'texture' ? (
                    <div className="text-gray-400 text-center">
                        <p>Sube una imagen base para comenzar</p>
                    </div>
                ) : (
                    <>
                        {editorMode === 'preview' && (
                            <canvas ref={canvasRef} className="max-w-full h-auto shadow-lg" />
                        )}

                        {editorMode === 'points' && (
                            activeSurface ? (
                                <div className="space-y-2 w-full h-full flex items-center justify-center relative">
                                    <div className="text-center font-medium bg-white/80 p-1 rounded absolute top-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                                        Definiendo forma: {activeSurface.name}
                                    </div>
                                    <SurfaceEditor
                                        mockupImage={mockupImage}
                                        surface={activeSurface}
                                        onPointsUpdate={onSurfacePointsUpdate}
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-500">Selecciona una superficie para editar sus puntos</div>
                            )
                        )}

                        {editorMode === 'texture' && (
                            !designImage ? (
                                <div className="text-gray-400 text-center">
                                    <p>Sube un diseño de prueba primero</p>
                                </div>
                            ) : (
                                activeSurface ? (
                                    <div className="space-y-2 w-full">
                                        <div className="text-center font-medium bg-white/80 p-1 rounded absolute top-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                                            Recortando textura para: {activeSurface.name}
                                        </div>
                                        <TextureMapEditor
                                            designImage={designImage}
                                            surface={activeSurface}
                                            onSourceAreaChange={(area) => onSourceAreaUpdate(activeSurface.id, area)}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-400">Selecciona una superficie para mapear</div>
                                )
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
