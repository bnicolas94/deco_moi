import * as THREE from 'three';
import type { PerspectiveConfig } from '@/types/mockup';
import createPerspectiveTransform from './perspectiveTransform';

/**
 * Aplica una transformación de perspectiva (homografía) a la geometría de una malla.
 * Mueve los vértices de un plano rectangular para que coincidan con los 4 puntos de perspectiva definidos.
 * 
 * @param mesh La malla (Mesh) de Three.js que contiene la geometría a deformar.
 * @param points Los 4 puntos de destino (en porcentaje 0-100 relativo al contenedor).
 * @param worldWidth El ancho del mundo 3D del plano original.
 * @param worldHeight El alto del mundo 3D del plano original.
 */
export function calculatePerspectiveTransform(
    mesh: THREE.Mesh,
    points: PerspectiveConfig,
    worldWidth: number,
    worldHeight: number
) {
    if (!mesh.geometry) return;

    // 1. Definir Límites de Origen (El plano sin deformar)
    // El plano está centrado en (0,0) con ancho worldWidth y alto worldHeight
    const halfW = worldWidth / 2;
    const halfH = worldHeight / 2;

    // Orden: TopLeft, TopRight, BottomRight, BottomLeft
    // Coordenadas locales del plano original
    const src = [
        -halfW, halfH,  // TL
        halfW, halfH,   // TR
        halfW, -halfH,  // BR
        -halfW, -halfH  // BL
    ];

    // 2. Definir Puntos de Destino (La forma de perspectiva en Coordenadas Mundiales)
    // Convertir 0-100% a Coordenadas Mundiales relativas al centro (0,0)
    // Sistema de coordenadas: 0% X = -halfW, 100% X = halfW
    // Sistema de coordenadas: 0% Y = halfH, 100% Y = -halfH (Y invertido en Three.js vs Pantalla)

    const toWorld = (p: { x: number, y: number }) => {
        const wx = (p.x / 100) * worldWidth - halfW;
        const wy = halfH - (p.y / 100) * worldHeight;
        return [wx, wy];
    };

    const dst = [
        ...toWorld(points.topLeft),
        ...toWorld(points.topRight),
        ...toWorld(points.bottomRight),
        ...toWorld(points.bottomLeft)
    ];

    // 3. Crear Transformación (Matriz de Homografía)
    const transform = createPerspectiveTransform(src, dst);

    // 4. Aplicar a la Geometría
    const geometry = mesh.geometry;
    const positionAttribute = geometry.attributes.position;

    // Iterar sobre todos los vértices y aplicar la transformación
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        // Z se mantiene en 0 (o podría ajustarse si fuera 3D real, pero asumimos proyección plana)

        const result = transform.transform(x, y);

        positionAttribute.setXY(i, result.x, result.y);
    }

    // Marcar para actualización
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
}
