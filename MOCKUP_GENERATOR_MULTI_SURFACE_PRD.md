# Generador de Mockups Multi-Superficie - Deco Moi
## Product Requirements Document (PRD) - Versión Completa

---

## 🎯 OBJETIVO

Crear un sistema que permita **aplicar diseños planos en 2D a productos 3D** con múltiples superficies visibles, respetando la perspectiva de cada cara del producto.

---

## 📸 CASO DE USO REAL

### Imágenes de Referencia:
1. **Caja blanca** (mockup base) → Producto vacío con perspectiva 3D
2. **Diseño plano** → Arte en 2D (patrón + texto) sin perspectiva
3. **Resultado final** → Diseño "envuelve" la caja en múltiples superficies

### Superficies Visibles en la Caja:
- 🔲 **Tapa superior** (área principal, más visible)
- 🔲 **Frente** (cara frontal con texto "Gracias por venir")
- 🔲 **Lateral derecho** (con patrón floral)
- 🔲 **Lateral izquierdo** (con patrón floral - opcional)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Componentes Principales

```
MockupGenerator (Contenedor)
├── CanvasView (Canvas principal)
├── ControlPanel (Controles)
│   ├── ImageUploader (Subir mockup base)
│   ├── DesignUploader (Subir diseño)
│   ├── SurfaceSelector (Seleccionar superficie activa)
│   ├── TransformControls (Escala, rotación, posición)
│   └── SurfaceEditor (Definir áreas - solo admin)
└── PreviewPanel (Vista previa final)
```

---

## 📐 MODELO DE DATOS

### Interface: MockupConfig

```typescript
interface Point2D {
  x: number;  // Porcentaje 0-100
  y: number;  // Porcentaje 0-100
}

interface DesignArea {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

interface SurfaceConfig {
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

interface MockupTemplate {
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
```

### Ejemplo de Configuración para Cajita Deco Moi

```typescript
const cajitaConfig: MockupTemplate = {
  id: 1,
  productId: 123,
  name: "Cajita 6 Chocolates - Vista 3/4",
  mockupImageUrl: "/images/mockups/caja-blanca.jpg",
  
  surfaces: [
    {
      id: "top",
      name: "Tapa Superior",
      designArea: {
        topLeft: { x: 15, y: 18 },
        topRight: { x: 85, y: 18 },
        bottomRight: { x: 88, y: 35 },
        bottomLeft: { x: 12, y: 35 }
      },
      sourceArea: {
        x: 0,
        y: 0,
        width: 1920,  // Todo el ancho del diseño
        height: 480   // Parte superior del diseño
      },
      transform: {
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0
      },
      isActive: true,
      zIndex: 3
    },
    {
      id: "front",
      name: "Frente",
      designArea: {
        topLeft: { x: 12, y: 35 },
        topRight: { x: 88, y: 35 },
        bottomRight: { x: 82, y: 58 },
        bottomLeft: { x: 18, y: 58 }
      },
      sourceArea: {
        x: 0,
        y: 480,
        width: 1920,
        height: 320   // Parte inferior del diseño con "Gracias por venir"
      },
      transform: {
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0
      },
      isActive: true,
      zIndex: 2
    },
    {
      id: "right",
      name: "Lateral Derecho",
      designArea: {
        topLeft: { x: 85, y: 18 },
        topRight: { x: 97, y: 22 },
        bottomRight: { x: 95, y: 45 },
        bottomLeft: { x: 88, y: 35 }
      },
      sourceArea: {
        x: 1600,  // Patrón lateral del diseño
        y: 0,
        width: 320,
        height: 800
      },
      transform: {
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0
      },
      isActive: true,
      zIndex: 1
    }
  ],
  
  defaultTransform: {
    scale: 1,
    rotation: 0
  },
  
  metadata: {
    resolution: { width: 1920, height: 1080 },
    createdAt: "2026-02-15",
    updatedAt: "2026-02-15"
  }
};
```

---

## 🎨 INTERFAZ DE USUARIO

### Modo Cliente (Simplificado)

```
┌─────────────────────────────────────────────────────────────┐
│              Visualiza tu Diseño Personalizado               │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  CONTROLES           │        CANVAS                        │
│                      │                                      │
│  📤 Subir Diseño     │   ┌─────────────────────────┐       │
│  [Archivo/Drag]      │   │                         │       │
│                      │   │   🎁 Caja con diseño    │       │
│  🎨 Ajustar          │   │   aplicado en todas     │       │
│                      │   │   las superficies       │       │
│  Escala: [=====]     │   │                         │       │
│  50% ◄──●──► 150%    │   │                         │       │
│                      │   └─────────────────────────┘       │
│  ↻ Rotación: [===]   │                                      │
│  -45° ◄──●──► 45°    │   💡 Tu diseño se aplicará          │
│                      │   automáticamente a todas las        │
│  [🔄 Resetear]       │   caras visibles de la caja          │
│  [💾 Agregar]        │                                      │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### Modo Admin (Avanzado)

```
┌─────────────────────────────────────────────────────────────┐
│           Generador de Mockups - Modo Administrador          │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  📦 MOCKUP BASE      │        CANVAS EDITOR                 │
│  [Upload]            │                                      │
│  caja-blanca.jpg     │   ┌─────────────────────────┐       │
│                      │   │  ●────────────●         │       │
│  🎨 DISEÑO           │   │  │            │         │       │
│  [Upload]            │   │  │   TAPA     │         │       │
│  diseno.jpg          │   │  │            │         │       │
│                      │   │  ●────────────●         │       │
│  📐 SUPERFICIES      │   │  ●──────────●           │       │
│                      │   │  │ FRENTE   │           │       │
│  ✅ Tapa Superior    │   │  ●──────────●           │       │
│     Editar Puntos    │   │    ●──●                 │       │
│     [●●●●]           │   │    │LA│                 │       │
│                      │   │    ●──●                 │       │
│  ✅ Frente           │   └─────────────────────────┘       │
│     Editar Puntos    │                                      │
│     [●●●●]           │   🎯 Superficie activa: TAPA        │
│                      │                                      │
│  ✅ Lateral Derecho  │   Puntos (%)                         │
│     Editar Puntos    │   TL: [15][18]  TR: [85][18]       │
│     [●●●●]           │   BL: [12][35]  BR: [88][35]       │
│                      │                                      │
│  🎛️ RECORTE DISEÑO   │   📊 ÁREA FUENTE DEL DISEÑO         │
│  (para superficie    │   X: [0] Y: [0]                     │
│   activa)            │   W: [1920] H: [480]                │
│                      │                                      │
│  [Vista Previa]      │   💾 [Guardar Config]               │
│  [Exportar PNG]      │   📥 [Exportar Resultado]           │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 🔧 COMPONENTE PRINCIPAL

### MockupGenerator.tsx

```typescript
import React, { useState, useRef, useEffect } from 'react';

interface MockupGeneratorProps {
  mode: 'client' | 'admin';
  templateId?: number;
  productId?: number;
  onSave?: (mockupUrl: string, config: MockupTemplate) => void;
}

export function MockupGenerator({ 
  mode, 
  templateId, 
  productId,
  onSave 
}: MockupGeneratorProps) {
  // Estado principal
  const [mockupImage, setMockupImage] = useState<HTMLImageElement | null>(null);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
  const [template, setTemplate] = useState<MockupTemplate | null>(null);
  const [activeSurfaceId, setActiveSurfaceId] = useState<string>('top');
  const [globalTransform, setGlobalTransform] = useState({
    scale: 1,
    rotation: 0
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cargar template si existe
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else if (productId) {
      // Cargar template por defecto del producto
      loadProductTemplate(productId);
    }
  }, [templateId, productId]);
  
  // Renderizar cada vez que cambia algo
  useEffect(() => {
    if (mockupImage && designImage && template && canvasRef.current) {
      renderMultiSurfaceMockup(
        canvasRef.current,
        mockupImage,
        designImage,
        template,
        globalTransform
      );
    }
  }, [mockupImage, designImage, template, globalTransform, activeSurfaceId]);
  
  // Handlers
  const handleMockupUpload = async (file: File) => {
    const img = await loadImage(file);
    setMockupImage(img);
  };
  
  const handleDesignUpload = async (file: File) => {
    const img = await loadImage(file);
    setDesignImage(img);
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
    link.download = `mockup-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    
    if (onSave) {
      onSave(dataUrl, template!);
    }
  };
  
  const handleSaveTemplate = async () => {
    if (!template) return;
    
    try {
      const response = await fetch('/api/mockup/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      const saved = await response.json();
      alert('Template guardado exitosamente!');
      setTemplate(saved);
    } catch (error) {
      alert('Error al guardar template: ' + error.message);
    }
  };
  
  return (
    <div className="mockup-generator">
      {mode === 'client' ? (
        <ClientView
          mockupImage={mockupImage}
          designImage={designImage}
          template={template}
          globalTransform={globalTransform}
          onDesignUpload={handleDesignUpload}
          onTransformChange={setGlobalTransform}
          onExport={handleExport}
          canvasRef={canvasRef}
        />
      ) : (
        <AdminView
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
        />
      )}
    </div>
  );
}
```

---

## 🎨 ALGORITMO DE RENDERIZADO MULTI-SUPERFICIE

### renderMultiSurfaceMockup.ts

```typescript
import PerspT from 'perspective-transform';

interface RenderOptions {
  quality?: number;  // 1-10, default 5
  antiAlias?: boolean;
  blendMode?: 'normal' | 'multiply' | 'overlay';
}

export function renderMultiSurfaceMockup(
  canvas: HTMLCanvasElement,
  mockupImage: HTMLImageElement,
  designImage: HTMLImageElement,
  template: MockupTemplate,
  globalTransform: { scale: number; rotation: number },
  options: RenderOptions = {}
) {
  const ctx = canvas.getContext('2d', { 
    alpha: true,
    willReadFrequently: false 
  })!;
  
  // Configurar canvas
  canvas.width = mockupImage.width;
  canvas.height = mockupImage.height;
  
  // 1. Dibujar mockup base
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mockupImage, 0, 0);
  
  // 2. Ordenar superficies por zIndex
  const sortedSurfaces = [...template.surfaces]
    .filter(s => s.isActive)
    .sort((a, b) => a.zIndex - b.zIndex);
  
  // 3. Renderizar cada superficie
  for (const surface of sortedSurfaces) {
    renderSurface(
      ctx,
      designImage,
      surface,
      globalTransform,
      canvas.width,
      canvas.height,
      options
    );
  }
}

function renderSurface(
  ctx: CanvasRenderingContext2D,
  designImage: HTMLImageElement,
  surface: SurfaceConfig,
  globalTransform: { scale: number; rotation: number },
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions
) {
  // 1. Extraer la porción del diseño para esta superficie
  const sourceCanvas = extractDesignPortion(
    designImage,
    surface.sourceArea,
    globalTransform
  );
  
  // 2. Aplicar transformación de perspectiva
  applyPerspectiveToSurface(
    ctx,
    sourceCanvas,
    surface.designArea,
    surface.transform || { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
    canvasWidth,
    canvasHeight,
    options
  );
}

function extractDesignPortion(
  designImage: HTMLImageElement,
  sourceArea: SurfaceConfig['sourceArea'],
  globalTransform: { scale: number; rotation: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  if (!sourceArea) {
    // Si no hay área definida, usar toda la imagen
    canvas.width = designImage.width;
    canvas.height = designImage.height;
    ctx.drawImage(designImage, 0, 0);
    return canvas;
  }
  
  // Extraer porción específica
  canvas.width = sourceArea.width;
  canvas.height = sourceArea.height;
  
  ctx.drawImage(
    designImage,
    sourceArea.x, sourceArea.y,           // Posición origen
    sourceArea.width, sourceArea.height,   // Tamaño origen
    0, 0,                                  // Posición destino
    sourceArea.width, sourceArea.height    // Tamaño destino
  );
  
  // Aplicar transformación global
  if (globalTransform.scale !== 1 || globalTransform.rotation !== 0) {
    const transformedCanvas = document.createElement('canvas');
    const transformedCtx = transformedCanvas.getContext('2d')!;
    
    const scaledWidth = canvas.width * globalTransform.scale;
    const scaledHeight = canvas.height * globalTransform.scale;
    
    transformedCanvas.width = scaledWidth;
    transformedCanvas.height = scaledHeight;
    
    transformedCtx.save();
    transformedCtx.translate(scaledWidth / 2, scaledHeight / 2);
    transformedCtx.rotate((globalTransform.rotation * Math.PI) / 180);
    transformedCtx.scale(globalTransform.scale, globalTransform.scale);
    transformedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    transformedCtx.restore();
    
    return transformedCanvas;
  }
  
  return canvas;
}

function applyPerspectiveToSurface(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  designArea: DesignArea,
  surfaceTransform: { scale: number; rotation: number; offsetX: number; offsetY: number },
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions
) {
  // Convertir puntos de porcentaje a píxeles
  const tl = percentToPixels(designArea.topLeft, canvasWidth, canvasHeight);
  const tr = percentToPixels(designArea.topRight, canvasWidth, canvasHeight);
  const br = percentToPixels(designArea.bottomRight, canvasWidth, canvasHeight);
  const bl = percentToPixels(designArea.bottomLeft, canvasWidth, canvasHeight);
  
  // Aplicar offset de superficie
  tl.x += surfaceTransform.offsetX;
  tl.y += surfaceTransform.offsetY;
  tr.x += surfaceTransform.offsetX;
  tr.y += surfaceTransform.offsetY;
  br.x += surfaceTransform.offsetX;
  br.y += surfaceTransform.offsetY;
  bl.x += surfaceTransform.offsetX;
  bl.y += surfaceTransform.offsetY;
  
  // Crear transformación de perspectiva
  const srcCorners = [
    0, 0,
    sourceCanvas.width, 0,
    sourceCanvas.width, sourceCanvas.height,
    0, sourceCanvas.height
  ];
  
  const dstCorners = [
    tl.x, tl.y,
    tr.x, tr.y,
    br.x, br.y,
    bl.x, bl.y
  ];
  
  const perspT = PerspT(srcCorners, dstCorners);
  
  // Obtener datos de imagen fuente
  const sourceCtx = sourceCanvas.getContext('2d')!;
  const sourceImageData = sourceCtx.getImageData(
    0, 0, 
    sourceCanvas.width, 
    sourceCanvas.height
  );
  
  // Calcular bounding box del área de destino
  const minX = Math.floor(Math.min(tl.x, tr.x, br.x, bl.x));
  const maxX = Math.ceil(Math.max(tl.x, tr.x, br.x, bl.x));
  const minY = Math.floor(Math.min(tl.y, tr.y, br.y, bl.y));
  const maxY = Math.ceil(Math.max(tl.y, tr.y, br.y, bl.y));
  
  // Crear ImageData para el resultado
  const resultWidth = maxX - minX;
  const resultHeight = maxY - minY;
  const resultImageData = ctx.createImageData(resultWidth, resultHeight);
  
  // Aplicar transformación pixel por pixel (con optimización)
  const quality = options.quality || 5;
  const step = Math.max(1, Math.floor(10 / quality));
  
  for (let y = 0; y < resultHeight; y += step) {
    for (let x = 0; x < resultWidth; x += step) {
      const globalX = x + minX;
      const globalY = y + minY;
      
      try {
        const [srcX, srcY] = perspT.transformInverse(globalX, globalY);
        
        if (srcX >= 0 && srcX < sourceCanvas.width && 
            srcY >= 0 && srcY < sourceCanvas.height) {
          
          const srcIdx = (Math.floor(srcY) * sourceCanvas.width + Math.floor(srcX)) * 4;
          const dstIdx = (y * resultWidth + x) * 4;
          
          // Copiar pixel con alpha blending
          const alpha = sourceImageData.data[srcIdx + 3] / 255;
          
          resultImageData.data[dstIdx] = sourceImageData.data[srcIdx];
          resultImageData.data[dstIdx + 1] = sourceImageData.data[srcIdx + 1];
          resultImageData.data[dstIdx + 2] = sourceImageData.data[srcIdx + 2];
          resultImageData.data[dstIdx + 3] = sourceImageData.data[srcIdx + 3];
          
          // Llenar píxeles saltados (si step > 1)
          if (step > 1) {
            for (let dy = 0; dy < step; dy++) {
              for (let dx = 0; dx < step; dx++) {
                const fillIdx = ((y + dy) * resultWidth + (x + dx)) * 4;
                if (fillIdx < resultImageData.data.length) {
                  resultImageData.data[fillIdx] = resultImageData.data[dstIdx];
                  resultImageData.data[fillIdx + 1] = resultImageData.data[dstIdx + 1];
                  resultImageData.data[fillIdx + 2] = resultImageData.data[dstIdx + 2];
                  resultImageData.data[fillIdx + 3] = resultImageData.data[dstIdx + 3];
                }
              }
            }
          }
        }
      } catch (e) {
        // Punto fuera de la transformación
      }
    }
  }
  
  // Aplicar resultado al canvas principal
  ctx.putImageData(resultImageData, minX, minY);
}

function percentToPixels(
  point: Point2D,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: (point.x / 100) * width,
    y: (point.y / 100) * height
  };
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

## 🎛️ COMPONENTE: SurfaceEditor (Admin)

```typescript
import React, { useRef, useEffect, useState } from 'react';

interface SurfaceEditorProps {
  mockupImage: HTMLImageElement | null;
  surface: SurfaceConfig;
  onPointsUpdate: (points: DesignArea) => void;
}

export function SurfaceEditor({ 
  mockupImage, 
  surface, 
  onPointsUpdate 
}: SurfaceEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<keyof DesignArea | null>(null);
  const [points, setPoints] = useState<DesignArea>(surface.designArea);
  
  useEffect(() => {
    if (!canvasRef.current || !mockupImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Ajustar canvas al mockup
    canvas.width = mockupImage.width;
    canvas.height = mockupImage.height;
    
    // Dibujar mockup
    ctx.drawImage(mockupImage, 0, 0);
    
    // Dibujar puntos y líneas
    drawSurfaceOverlay(ctx, points, canvas.width, canvas.height);
  }, [mockupImage, points]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Detectar qué punto está siendo arrastrado
    const pointKey = detectNearestPoint(x, y, points);
    if (pointKey) {
      setDraggingPoint(pointKey);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPoint || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    const newPoints = {
      ...points,
      [draggingPoint]: { x, y }
    };
    
    setPoints(newPoints);
    onPointsUpdate(newPoints);
  };
  
  const handleMouseUp = () => {
    setDraggingPoint(null);
  };
  
  return (
    <div className="surface-editor">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: draggingPoint ? 'grabbing' : 'grab',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      
      <div className="point-inputs">
        {Object.entries(points).map(([key, point]) => (
          <div key={key} className="point-input-row">
            <label>{key}:</label>
            <input 
              type="number" 
              value={point.x.toFixed(1)}
              step="0.1"
              onChange={(e) => {
                const newPoints = {
                  ...points,
                  [key]: { ...point, x: parseFloat(e.target.value) }
                };
                setPoints(newPoints);
                onPointsUpdate(newPoints);
              }}
            />
            <input 
              type="number" 
              value={point.y.toFixed(1)}
              step="0.1"
              onChange={(e) => {
                const newPoints = {
                  ...points,
                  [key]: { ...point, y: parseFloat(e.target.value) }
                };
                setPoints(newPoints);
                onPointsUpdate(newPoints);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

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
  
  // Dibujar líneas
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.stroke();
  
  ctx.setLineDash([]);
  
  // Dibujar puntos
  const drawPoint = (p: { x: number; y: number }, label: string) => {
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(label, p.x + 12, p.y + 4);
  };
  
  drawPoint(tl, 'TL');
  drawPoint(tr, 'TR');
  drawPoint(br, 'BR');
  drawPoint(bl, 'BL');
}

function detectNearestPoint(
  x: number, 
  y: number, 
  points: DesignArea,
  threshold: number = 5
): keyof DesignArea | null {
  const distances = {
    topLeft: Math.hypot(points.topLeft.x - x, points.topLeft.y - y),
    topRight: Math.hypot(points.topRight.x - x, points.topRight.y - y),
    bottomRight: Math.hypot(points.bottomRight.x - x, points.bottomRight.y - y),
    bottomLeft: Math.hypot(points.bottomLeft.x - x, points.bottomLeft.y - y)
  };
  
  const [nearest, distance] = Object.entries(distances)
    .sort(([, a], [, b]) => a - b)[0];
  
  return distance < threshold ? nearest as keyof DesignArea : null;
}
```

---

## 💾 API ENDPOINTS

### POST /api/mockup/templates

**Request:**
```typescript
{
  productId: number;
  name: string;
  mockupImageUrl: string;
  surfaces: SurfaceConfig[];
  defaultTransform: { scale: number; rotation: number };
}
```

**Response:**
```typescript
{
  id: number;
  ...MockupTemplate
}
```

---

### GET /api/mockup/templates/:id

**Response:**
```typescript
MockupTemplate
```

---

### PUT /api/mockup/templates/:id

**Request:** Partial MockupTemplate

---

### GET /api/mockup/templates/product/:productId

**Response:**
```typescript
MockupTemplate[]  // Todos los templates del producto
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Componentes Básicos (2-3 días)
- [ ] MockupGenerator con modo cliente/admin
- [ ] Upload de imágenes
- [ ] Canvas básico
- [ ] Controles de transformación global

### Fase 2: Multi-Superficie (3-4 días)
- [ ] Estructura de datos para múltiples superficies
- [ ] Algoritmo de extracción de porciones del diseño
- [ ] Renderizado multi-superficie con zIndex
- [ ] SurfaceEditor component

### Fase 3: Editor de Puntos (2-3 días)
- [ ] Canvas interactivo para arrastrar puntos
- [ ] Inputs numéricos para ajuste fino
- [ ] Preview en tiempo real

### Fase 4: Recorte de Diseño (2 días)
- [ ] Interface para definir sourceArea
- [ ] Preview del recorte
- [ ] Guardar configuración por superficie

### Fase 5: Backend y API (2 días)
- [ ] CRUD de templates
- [ ] Asociar templates a productos
- [ ] Upload de imágenes

### Fase 6: Optimización (2-3 días)
- [ ] Web Workers para transformación
- [ ] Cache de imágenes
- [ ] Debouncing de renders
- [ ] Calidad ajustable

### Fase 7: UX/UI (2-3 días)
- [ ] Responsive design
- [ ] Loading states
- [ ] Tooltips y ayudas
- [ ] Teclado shortcuts

**Total estimado: 15-20 días**

---

## 🎯 RESULTADO ESPERADO

El sistema debe permitir:

✅ **Modo Cliente:**
- Subir diseño
- Ver preview automático en todas las superficies
- Ajustar escala y rotación global
- Descargar resultado

✅ **Modo Admin:**
- Definir áreas de cada superficie visualmente
- Configurar qué porción del diseño va a cada superficie
- Guardar configuración reutilizable
- Crear mockups de productos nuevos

✅ **Calidad:**
- Perspectiva realista en cada superficie
- Sin distorsiones
- Alta resolución de salida
- Performance fluido

---

## 📚 DEPENDENCIAS

```json
{
  "dependencies": {
    "perspective-transform": "^1.1.3",
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0"
  }
}
```

---

## 🎓 NOTAS PARA ANTIGRAVITY

### Conceptos Clave:

1. **Múltiples Superficies = Múltiples Transformaciones**
   - Cada cara de la caja es una transformación de perspectiva independiente
   - Se renderizan en orden de zIndex

2. **Source Area = Recorte del Diseño**
   - Permite usar diferentes partes del diseño en diferentes superficies
   - La tapa usa la parte superior, el frente usa la inferior, etc.

3. **Transformación Global vs Por Superficie**
   - Global: afecta al diseño antes de aplicarlo
   - Por Superficie: ajustes finos después de la perspectiva

4. **Calidad vs Performance**
   - Pixel-by-pixel es lento pero preciso
   - Usar Web Workers para no bloquear UI
   - Ajustar quality según necesidad

---

**FIN DEL PRD MULTI-SUPERFICIE**

*Documento completo con soporte para aplicar diseños en múltiples caras de productos 3D*
