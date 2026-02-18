import React, { useEffect, useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Center, useProgress, Html } from '@react-three/drei';
import { useMockupStore } from '@/stores/mockupStore';
import { calculatePerspectiveTransform } from '@/lib/mockup/threeUtils';
import type { PerspectiveConfig } from '@/types/mockup';

interface BaseLayerProps {
    imageUrl: string;
    onLoad?: (width: number, height: number) => void;
}

const BaseLayer: React.FC<BaseLayerProps> = ({ imageUrl, onLoad }) => {
    const texture = useLoader(THREE.TextureLoader, imageUrl);

    useEffect(() => {
        if (texture && onLoad) {
            onLoad(texture.image.width, texture.image.height);
        }
    }, [texture, onLoad]);

    const aspectRatio = texture.image.width / texture.image.height;

    return (
        <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[aspectRatio * 5, 5]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
};

interface DesignLayerProps {
    imageUrl: string;
    perspectivePoints: PerspectiveConfig;
    baseWidth: number;
    baseHeight: number;
}

// OBB: Oriented Bounding Box Data
interface OBB {
    angle: number; // Rotation angle to align with axis
    origin: { x: number; y: number }; // Pivot point (usually topLeft of first surface)
    minU: number;
    maxU: number;
    minV: number;
    maxV: number;
}

const DesignLayer: React.FC<DesignLayerProps & { obb: OBB }> = ({
    imageUrl,
    perspectivePoints,
    baseWidth,
    baseHeight,
    obb
}) => {
    const texture = useLoader(THREE.TextureLoader, imageUrl);
    const meshRef = useRef<THREE.Mesh>(null);
    const { designTransform } = useMockupStore();

    useEffect(() => {
        if (meshRef.current && baseWidth > 0 && baseHeight > 0) {
            const worldHeight = 5;
            const worldWidth = (baseWidth / baseHeight) * worldHeight;

            // 1. Geometry
            const geo = new THREE.PlaneGeometry(worldWidth, worldHeight, 32, 32);
            meshRef.current.geometry.dispose();
            meshRef.current.geometry = geo;

            // 2. Local Bounds (0-100 space)
            const xs = [perspectivePoints.topLeft.x, perspectivePoints.topRight.x, perspectivePoints.bottomRight.x, perspectivePoints.bottomLeft.x];
            const ys = [perspectivePoints.topLeft.y, perspectivePoints.topRight.y, perspectivePoints.bottomRight.y, perspectivePoints.bottomLeft.y];
            const localMinX = Math.min(...xs);
            const localMaxX = Math.max(...xs);
            const localMinY = Math.min(...ys);
            const localMaxY = Math.max(...ys);

            // 3. UV Mapping using OBB
            // We rotate the point into the aligned space, then normalize by OBB dimensions.

            const uvAttribute = geo.attributes.uv;
            const cosA = Math.cos(-obb.angle); // Rotate opposite to alignment angle
            const sinA = Math.sin(-obb.angle);
            const widthBB = obb.maxU - obb.minU || 1;
            const heightBB = obb.maxV - obb.minV || 1;

            for (let i = 0; i < uvAttribute.count; i++) {
                const u = uvAttribute.getX(i);
                const v = uvAttribute.getY(i);

                // World Pos (0..100)
                const Px = localMinX + u * (localMaxX - localMinX);
                const Py = localMinY + (1 - v) * (localMaxY - localMinY);

                // Relative to Origin
                const dx = Px - obb.origin.x;
                const dy = Py - obb.origin.y;

                // Rotate
                const rotX = dx * cosA - dy * sinA;
                const rotY = dx * sinA + dy * cosA;

                // Normalize in OBB space
                const globalU = (rotX - obb.minU) / widthBB;
                const globalV = (rotY - obb.minV) / heightBB;

                // Map to UV (V is inverted in texture space typically 0=bottom, but screen Y 0=top.
                // If Py increases downwards, rotY increases downwards (roughly).
                // If we want texture Top at OBB Top (minV), then globalV 0 should be V 1?
                // Visual check: minV is top-most. globalV=0. Texture Top should be there.
                // Texture V=1 is Top. So UV.y = 1 - globalV;

                uvAttribute.setXY(i, globalU, 1 - globalV);
            }
            uvAttribute.needsUpdate = true;

            // 4. Perspective Deform
            calculatePerspectiveTransform(
                meshRef.current,
                perspectivePoints,
                worldWidth,
                worldHeight
            );
        }
    }, [perspectivePoints, baseWidth, baseHeight, obb]);

    useEffect(() => {
        if (texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            // Aspect Ratio Correction (Cover Logic)
            // OBB Dimensions in Pixels
            const bW = baseWidth || 1;
            const bH = baseHeight || 1;
            // Note: Since we rotated, we should ideally account for non-square pixel aspect ratio if bW != bH,
            // but for simplicity assuming 1:1 pixel aspect ratio is fine for web images.
            // Width in % -> Pixels: (obb.maxU - obb.minU) * (baseWidth / 100) ? 
            // Wait, coordinate space is 0-100 independent of aspect ratio?
            // Usually points.x is 0-100% of Width. points.y is 0-100% of Height.
            // So distance 10 in X != distance 10 in Y if Width != Height.

            // Scaled OBB Dimensions (Real Pixels approximate)
            const obbW = (obb.maxU - obb.minU) * (bW / 100);
            const obbH = (obb.maxV - obb.minV) * (bH / 100);

            const boxAR = obbW / obbH;
            const imgAR = texture.image.width / texture.image.height;

            let repeatX = 1;
            let repeatY = 1;

            if (boxAR > imgAR) {
                // Box Wider. Match Width. Crop Height.
                // Visible fraction of texture height = imgAR / boxAR ( < 1)
                repeatY = imgAR / boxAR;
            } else {
                // Box Taller. Match Height. Crop Width.
                repeatX = boxAR / imgAR;
            }

            const scale = Math.max(0.01, designTransform.scale);
            texture.repeat.set(repeatX / scale, repeatY / scale);
            texture.rotation = (designTransform.rotation * Math.PI) / 180;
            texture.center.set(0.5, 0.5);
            texture.offset.set(designTransform.position.x * 0.01, designTransform.position.y * 0.01);
        }
    }, [designTransform, texture, baseWidth, baseHeight, obb]);

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <planeGeometry args={[1, 1, 32, 32]} />
            <meshBasicMaterial map={texture} transparent opacity={0.9} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

function Loader() {
    const { progress } = useProgress();
    return <Html center>{progress.toFixed(1)} % loaded</Html>;
}

export const MockupCanvas: React.FC<{ className?: string }> = ({ className = "w-full h-full min-h-[400px]" }) => {
    const { baseImage, designImage, surfaces } = useMockupStore();
    const [imgDims, setImgDims] = useState({ width: 1, height: 1 });

    // Calculates Oriented Bounding Box based on the first surface (Primary)
    const obb = useMemo(() => {
        if (surfaces.length === 0) {
            return { angle: 0, origin: { x: 0, y: 0 }, minU: 0, maxU: 100, minV: 0, maxV: 100 };
        }

        // 1. Determine Angle from Primary Surface (Top Edge)
        const s = surfaces[0];
        const dx = s.points.topRight.x - s.points.topLeft.x;
        // Aspect Ratio Correction for Angle Calculation!
        // dx is in % of Width. dy is in % of Height.
        // To get real angle, we need pixels (or assuming aspect ratio).
        // Let's rely on stored imgDims if available, else assume 1:1.
        // For stability, let's assume raw % space for rotation alignment, or pass AR.
        // Let's use raw % space. If the box is squashed, the angle might be slightly off visually 
        // but consistent for mapping.
        const dy = s.points.topRight.y - s.points.topLeft.y;

        const angle = Math.atan2(dy, dx);
        const origin = s.points.topLeft;
        const cosA = Math.cos(-angle);
        const sinA = Math.sin(-angle);

        // 2. Project all points of all surfaces to find min/max in rotated space
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;

        surfaces.forEach(surf => {
            const pts = [surf.points.topLeft, surf.points.topRight, surf.points.bottomRight, surf.points.bottomLeft];
            pts.forEach(p => {
                // Relative to origin
                const pdx = p.x - origin.x;
                const pdy = p.y - origin.y;

                // Rotate
                const ru = pdx * cosA - pdy * sinA;
                const rv = pdx * sinA + pdy * cosA;

                if (ru < minU) minU = ru;
                if (ru > maxU) maxU = ru;
                if (rv < minV) minV = rv;
                if (rv > maxV) maxV = rv;
            });
        });

        // Add slight padding to prevent edge clipping? No, strict is better for wrapping.
        return { angle, origin, minU, maxU, minV, maxV };
    }, [surfaces]); // Doesn't depend on imgDims to avoid re-calc jitter loop, but means angle is in % space

    return (
        <div className={className}>
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]}>
                <color attach="background" args={['#f3f4f6']} />
                <ambientLight intensity={1} />
                <OrbitControls enableZoom={true} enablePan={true} />
                <Suspense fallback={<Loader />}>
                    <Center>
                        {baseImage ? (
                            <BaseLayer imageUrl={baseImage} onLoad={(w, h) => setImgDims({ width: w, height: h })} />
                        ) : (
                            <mesh>
                                <planeGeometry args={[5, 3]} />
                                <meshBasicMaterial color="#e5e7eb" />
                                <Html center><div className="text-gray-500 text-sm">Sin imagen base</div></Html>
                            </mesh>
                        )}

                        {baseImage && designImage && surfaces.map((surface) => (
                            <DesignLayer
                                key={surface.id}
                                imageUrl={designImage}
                                perspectivePoints={surface.points}
                                baseWidth={imgDims.width}
                                baseHeight={imgDims.height}
                                obb={obb}
                            />
                        ))}
                    </Center>
                </Suspense>
            </Canvas>
        </div>
    );
};
