export interface Point2D {
    x: number;  // Porcentaje 0-100
    y: number;  // Porcentaje 0-100
}

export interface DesignArea {
    topLeft: Point2D;
    topRight: Point2D;
    bottomRight: Point2D;
    bottomLeft: Point2D;
}

export interface SurfaceConfig {
    id: string;
    name: string;
    designArea: DesignArea;
    // Área del diseño fuente que se aplica a esta superficie
    sourceArea?: {
        x: number;      // Píxeles desde la izquierda
        y: number;      // Píxeles desde arriba
        width: number;  // Ancho en píxeles
        height: number; // Alto en píxeles
    };
    // Transformación específica de esta superficie
    transform?: {
        scale: number;
        rotation: number;
        offsetX: number;
        offsetY: number;
    };
    isActive: boolean;
    zIndex: number;  // Orden de renderizado
}

export interface MockupTemplate {
    id: number;
    productId: number;
    name: string;
    mockupImageUrl: string;

    // Múltiples superficies
    surfaces: SurfaceConfig[];

    // Configuración global
    defaultTransform: {
        scale: number;
        rotation: number;
    };

    metadata: {
        resolution: { width: number; height: number };
        createdAt: string;
        updatedAt: string;
    };
}

// ==========================================
// Tipos de compatibilidad (Legacy)
// ==========================================
export type Point = Point2D;
export type PerspectiveConfig = DesignArea;

export interface Surface {
    id: string;
    name: string;
    points: PerspectiveConfig;
}

export interface CameraConfig {
    fov?: number;
    position?: { x: number; y: number; z: number };
}

export interface DesignPresets {
    defaultScale?: number;
    defaultRotation?: number;
    defaultPosition?: Point;
}
