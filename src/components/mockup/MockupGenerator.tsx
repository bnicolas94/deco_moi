import React, { useState, useRef, useEffect } from 'react';
import { AdminMockupView } from './AdminMockupView';
import { ClientMockupView } from './ClientMockupView';
import { loadImage } from '@/lib/mockup/renderMultiSurfaceMockup';
import type { MockupTemplate, DesignArea } from '@/types/mockup';
import { useMockupStore } from '@/stores/mockupStore';

interface MockupGeneratorProps {
    mode?: 'client' | 'admin';
    template?: MockupTemplate;
    productName?: string;
    onSave?: (mockupUrl: string, config: MockupTemplate) => void;
}

export function MockupGenerator({
    mode = 'client',
    template: initialTemplate,
    productName = 'Producto',
    onSave
}: MockupGeneratorProps) {
    // Estado principal
    const [mockupImage, setMockupImage] = useState<HTMLImageElement | null>(null);
    const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
    const [template, setTemplate] = useState<MockupTemplate | null>(initialTemplate || null);
    const [activeSurfaceId, setActiveSurfaceId] = useState<string>('');
    const [globalTransform, setGlobalTransform] = useState({
        scale: 1,
        rotation: 0
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setMode } = useMockupStore();

    useEffect(() => {
        console.log("MockupGenerator: Mounting with mode", mode);
        setMode(mode);
    }, [mode, setMode]);

    useEffect(() => {
        console.log("MockupGenerator: Template or Mode changed", { mode, template });
        // Inicializar template por defecto si estamos en admin sin template
        if (mode === 'admin' && !template) {
            console.log("MockupGenerator: Initializing default admin template");
            setTemplate({
                id: Date.now(),
                productId: 0,
                name: "Nuevo Mockup",
                mockupImageUrl: "",
                surfaces: [],
                defaultTransform: { scale: 1, rotation: 0 },
                metadata: {
                    resolution: { width: 1000, height: 1000 },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });
        }
    }, [mode, template]);

    // Cargar imagen de mockup si el template tiene una URL predefinida
    useEffect(() => {
        if (initialTemplate?.mockupImageUrl) {
            // Asumimos que la URL es accesible. En un caso real, manejaríamos la carga.
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = initialTemplate.mockupImageUrl;
            img.onload = () => setMockupImage(img);
        }
    }, [initialTemplate]);

    // Handlers
    const handleMockupUpload = async (file: File) => {
        try {
            const img = await loadImage(file);
            setMockupImage(img);
            if (template) {
                setTemplate({
                    ...template,
                    mockupImageUrl: URL.createObjectURL(file) // Para referencia temporal
                });
            }
        } catch (e) {
            console.error("Error loading mockup image", e);
        }
    };

    const handleDesignUpload = async (file: File) => {
        try {
            const img = await loadImage(file);
            setDesignImage(img);
        } catch (e) {
            console.error("Error loading design image", e);
        }
    };

    const updateSurfacePoints = (surfaceId: string, points: DesignArea) => {
        if (!template) return;

        setTemplate({
            ...template,
            surfaces: template.surfaces.map(s =>
                s.id === surfaceId
                    ? { ...s, designArea: points }
                    : s
            )
        });
    };

    const updateSourceArea = (surfaceId: string, sourceArea: any) => {
        if (!template) return;

        setTemplate({
            ...template,
            surfaces: template.surfaces.map(s =>
                s.id === surfaceId
                    ? { ...s, sourceArea }
                    : s
            )
        });
    };

    const handleExport = () => {
        if (!canvasRef.current) return;

        const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `mockup-${productName}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        if (onSave && template) {
            onSave(dataUrl, template);
        }
    };

    const handleSaveTemplate = async () => {
        if (!template) return;
        console.log("Saving template:", template);
        alert("Configuración guardada en consola (simulación)");
        // Aquí iría la llamada a la API
    };

    if (mode === 'client') {
        if (!template && !mockupImage) {
            return <div className="p-8 text-center bg-gray-50 rounded-lg">Cargando configuración del producto...</div>;
        }

        return (
            <ClientMockupView
                mockupImage={mockupImage}
                designImage={designImage}
                template={template}
                globalTransform={globalTransform}
                onDesignUpload={handleDesignUpload}
                onTransformChange={setGlobalTransform}
                onExport={handleExport}
                canvasRef={canvasRef}
                productName={productName}
            />
        );
    }

    return (
        <AdminMockupView
            mockupImage={mockupImage}
            designImage={designImage}
            template={template}
            activeSurfaceId={activeSurfaceId}
            globalTransform={globalTransform}
            onMockupUpload={handleMockupUpload}
            onDesignUpload={handleDesignUpload}
            onActiveSurfaceChange={setActiveSurfaceId}
            onSurfacePointsUpdate={updateSurfacePoints}
            onSourceAreaUpdate={updateSourceArea}
            onTransformChange={setGlobalTransform}
            onSaveTemplate={handleSaveTemplate}
            onExport={handleExport}
            canvasRef={canvasRef}
            setTemplate={setTemplate}
        />
    );
}

export default MockupGenerator;
