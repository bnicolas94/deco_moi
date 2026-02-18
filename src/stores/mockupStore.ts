import { create } from 'zustand';
import type { PerspectiveConfig, MockupTemplate, Point, Surface } from '@/types/mockup';

interface TransformConfig {
    scale: number;
    rotation: number;
    position: Point;
}

interface MockupState {
    mode: 'client' | 'admin';
    baseImage: string | null;
    designImage: string | null;

    currentTemplate: MockupTemplate | null;

    // Configuración de superficies (Admin)
    surfaces: Surface[];
    activeSurfaceId: string | null;

    // Estado del diseño (Cliente)
    designTransform: TransformConfig;

    isLoading: boolean;
    error: string | null;

    // Actions
    setMode: (mode: 'client' | 'admin') => void;
    setBaseImage: (url: string) => void;
    setDesignImage: (url: string) => void;
    setTemplate: (template: MockupTemplate) => void;

    addSurface: (name: string) => void;
    removeSurface: (id: string) => void;
    updateSurfacePoints: (id: string, points: PerspectiveConfig) => void;
    setActiveSurface: (id: string | null) => void;
    setSurfaceName: (id: string, name: string) => void;

    updateDesignTransform: (config: Partial<TransformConfig>) => void;
    resetDesignTransform: () => void;

    saveTemplate: (name: string, productId: number) => Promise<void>;
    loadProductTemplate: (productSlug: string) => Promise<void>;
}

const DEFAULT_POINTS: PerspectiveConfig = {
    topLeft: { x: 20, y: 20 },
    topRight: { x: 80, y: 20 },
    bottomRight: { x: 80, y: 80 },
    bottomLeft: { x: 20, y: 80 }
};

export const useMockupStore = create<MockupState>((set, get) => ({
    mode: 'client',
    baseImage: null,
    designImage: null,
    currentTemplate: null,

    surfaces: [],
    activeSurfaceId: null,

    designTransform: {
        scale: 1,
        rotation: 0,
        position: { x: 0, y: 0 }
    },

    isLoading: false,
    error: null,

    setMode: (mode) => set({ mode }),

    setBaseImage: (url) => set({ baseImage: url }),

    setDesignImage: (url) => set({ designImage: url }),

    setTemplate: (template) => {
        // Migración simple para templates viejos
        let initialSurfaces = template.surfaces || [];
        if (initialSurfaces.length === 0 && template.perspectiveConfig) {
            initialSurfaces = [{
                id: 'default',
                name: 'Principal',
                points: template.perspectiveConfig
            }];
        }

        set({
            currentTemplate: template,
            baseImage: template.baseImageUrl,
            surfaces: initialSurfaces,
            activeSurfaceId: initialSurfaces.length > 0 ? initialSurfaces[0].id : null
        });
    },

    addSurface: (name) => set((state) => {
        const newSurface: Surface = {
            id: crypto.randomUUID(),
            name,
            points: { ...DEFAULT_POINTS }
        };
        return {
            surfaces: [...state.surfaces, newSurface],
            activeSurfaceId: newSurface.id
        };
    }),

    removeSurface: (id) => set((state) => ({
        surfaces: state.surfaces.filter(s => s.id !== id),
        activeSurfaceId: state.activeSurfaceId === id ? (state.surfaces.length > 1 ? state.surfaces[0].id : null) : state.activeSurfaceId
    })),

    updateSurfacePoints: (id, points) => set((state) => ({
        surfaces: state.surfaces.map(s => s.id === id ? { ...s, points } : s)
    })),

    setActiveSurface: (id) => set({ activeSurfaceId: id }),

    setSurfaceName: (id, name) => set((state) => ({
        surfaces: state.surfaces.map(s => s.id === id ? { ...s, name } : s)
    })),

    updateDesignTransform: (config) => set((state) => ({
        designTransform: { ...state.designTransform, ...config }
    })),

    resetDesignTransform: () => set({
        designTransform: { scale: 1, rotation: 0, position: { x: 0, y: 0 } }
    }),

    saveTemplate: async (name, productId) => {
        const state = get();
        if (!state.baseImage) throw new Error('No base image');
        if (state.surfaces.length === 0) throw new Error('No defined surfaces');

        set({ isLoading: true, error: null });

        try {
            const payload = {
                productId,
                name,
                baseImageUrl: state.baseImage,
                surfaces: state.surfaces, // Ahora enviamos el array
                surfaceConfig: {},
                cameraConfig: {},
                designPresets: {
                    defaultScale: state.designTransform.scale,
                    defaultRotation: state.designTransform.rotation,
                    defaultPosition: state.designTransform.position
                }
            };

            const response = await fetch('/api/mockup/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save template');

        } catch (e: any) {
            set({ error: e.message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    loadProductTemplate: async (slug) => {
        set({ isLoading: true, error: null });
        // Placeholder logic
        set({ isLoading: false });
    }
}));
