# Generador de Mockups 3D - Deco Moi
## Especificación Técnica para Integración en Antigravity

---

## 📋 RESUMEN EJECUTIVO

### Objetivo
Desarrollar un sistema de generación de mockups 3D que permita a los clientes visualizar sus diseños personalizados aplicados a los productos (cajitas de chocolates) antes de comprar, y que permita al administrador crear mockups profesionales de productos nuevos.

### Contexto del Proyecto
Este componente se integra en el e-commerce de **Deco Moi** desarrollado en **Antigravity** con:
- **Framework**: Astro + React
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL + Drizzle ORM
- **Estilos**: Tailwind CSS

### Problema a Resolver
Los clientes necesitan visualizar cómo quedará su diseño personalizado en el producto físico antes de realizar la compra. Actualmente no existe esta funcionalidad, lo que genera:
- Incertidumbre en la compra
- Consultas por WhatsApp para ver ejemplos
- Menor tasa de conversión
- Devoluciones por expectativas no cumplidas

### Solución Propuesta
Sistema de mockups con dos interfaces:

1. **Modo Cliente**: Visualización simple y rápida de diseños en productos
2. **Modo Admin**: Herramienta profesional para crear mockups de productos nuevos

---

## 🎯 CASOS DE USO

### Caso de Uso 1: Cliente Visualiza su Personalización
**Actor**: Cliente navegando el e-commerce

**Flujo**:
1. Cliente está en la página de producto "Cajita Gold de 6"
2. Selecciona opciones de personalización (nombre, fecha, diseño)
3. Sube o selecciona un diseño/patrón
4. Sistema genera mockup 3D mostrando cómo quedará el producto
5. Cliente puede ajustar posición, escala, rotación
6. Cliente ve el resultado final en tiempo real
7. Cliente agrega al carrito con confianza

**Resultado**: Cliente sabe exactamente qué va a recibir

---

### Caso de Uso 2: Admin Crea Mockup de Producto Nuevo
**Actor**: Administrador de Deco Moi

**Flujo**:
1. Admin recibe fotos de un producto nuevo (ej: nueva cajita)
2. Accede al generador de mockups en modo admin
3. Sube la foto del producto vacío (mockup base)
4. Sube un diseño de ejemplo
5. Define los 4 puntos de perspectiva manualmente
6. Ajusta transformación 3D hasta que se vea realista
7. Guarda la configuración de perspectiva para ese producto
8. Genera y descarga el mockup final
9. Lo usa en la página del producto

**Resultado**: Mockup profesional sin usar Photoshop

---

## 🏗️ ARQUITECTURA

### Estructura de Componentes

```
src/
├── components/
│   └── mockup/
│       ├── MockupGenerator.tsx          // Componente principal wrapper
│       ├── ClientMockupView.tsx         // Vista para clientes
│       ├── AdminMockupView.tsx          // Vista para administradores
│       ├── MockupCanvas.tsx             // Canvas con Three.js
│       ├── MockupControls.tsx           // Controles de transformación
│       ├── ProductTemplateSelector.tsx  // Selector de productos
│       ├── DesignUploader.tsx           // Subida de diseños
│       └── PerspectiveEditor.tsx        // Editor de puntos 3D (admin)
├── lib/
│   └── mockup/
│       ├── mockupEngine.ts              // Lógica de transformación 3D
│       ├── perspectiveTransform.ts      // Algoritmos de perspectiva
│       ├── mockupTemplates.ts           // Configuraciones guardadas
│       └── imageProcessor.ts            // Procesamiento de imágenes
├── stores/
│   └── mockupStore.ts                   // Estado global del mockup
└── types/
    └── mockup.ts                        // TypeScript types
```

---

## 📦 DEPENDENCIAS NECESARIAS

### Librerías de 3D y Canvas

```json
{
  "dependencies": {
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "three": "^0.159.0",
    "fabric": "^5.3.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10",
    "gl-matrix": "^3.4.3"
  }
}
```

### Opción Recomendada: **React Three Fiber**
- Más moderno y React-friendly
- Mejor performance
- Comunidad activa
- Fácil integración con Astro

### Opción Alternativa: **Fabric.js**
- Más ligero
- Más fácil de aprender
- Suficiente para casos simples
- Mejor para 2D con perspectiva

---

## 🎨 MODELO DE DATOS

### Tabla: mockup_templates

```typescript
// Schema de Drizzle ORM

export const mockupTemplates = pgTable('mockup_templates', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  
  // Imagen del mockup base (producto vacío)
  baseImageUrl: varchar('base_image_url', { length: 500 }).notNull(),
  
  // Configuración de perspectiva (4 puntos)
  perspectiveConfig: json('perspective_config').$type<{
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  }>().notNull(),
  
  // Configuración de la superficie 3D
  surfaceConfig: json('surface_config').$type<{
    width: number;
    height: number;
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
  }>(),
  
  // Configuración de cámara (para Three.js)
  cameraConfig: json('camera_config').$type<{
    position: { x: number; y: number; z: number };
    fov: number;
    lookAt: { x: number; y: number; z: number };
  }>(),
  
  // Presets de diseño
  designPresets: json('design_presets').$type<{
    defaultScale: number;
    defaultRotation: number;
    defaultPosition: { x: number; y: number };
    minScale: number;
    maxScale: number;
  }>(),
  
  // Metadatos
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Relación con Productos

```typescript
// En el modelo de productos existente, agregar:

export const products = pgTable('products', {
  // ... campos existentes ...
  
  // Referencia al template de mockup
  mockupTemplateId: integer('mockup_template_id')
    .references(() => mockupTemplates.id),
  
  // Permitir mockup en este producto
  allowsMockup: boolean('allows_mockup').default(false),
});
```

---

## 🔧 COMPONENTES PRINCIPALES

### 1. MockupGenerator.tsx

**Props**:
```typescript
interface MockupGeneratorProps {
  mode: 'client' | 'admin';
  productId?: number;
  templateId?: number;
  onSave?: (mockupImageUrl: string) => void;
  onCancel?: () => void;
}
```

**Responsabilidades**:
- Renderizar ClientMockupView o AdminMockupView según el modo
- Gestionar estado global del mockup
- Coordinar entre componentes hijos

**Ejemplo de uso**:
```tsx
// En la página de producto
<MockupGenerator 
  mode="client" 
  productId={product.id}
  onSave={(imageUrl) => addToCartWithMockup(imageUrl)}
/>

// En el panel admin
<MockupGenerator 
  mode="admin"
  onSave={(imageUrl) => saveProductMockup(imageUrl)}
/>
```

---

### 2. MockupCanvas.tsx (Three.js)

**Tecnología**: React Three Fiber + Three.js

**Estructura**:
```tsx
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface MockupCanvasProps {
  baseImage: string;
  designImage: string | null;
  perspectivePoints: PerspectiveConfig;
  designTransform: {
    scale: number;
    rotation: number;
    position: { x: number; y: number };
  };
  mode: 'client' | 'admin';
}

export function MockupCanvas({ 
  baseImage, 
  designImage, 
  perspectivePoints,
  designTransform,
  mode 
}: MockupCanvasProps) {
  return (
    <Canvas>
      {/* Cámara configurada según el mockup */}
      <PerspectiveCamera 
        makeDefault 
        position={[0, 0, 5]} 
        fov={50} 
      />
      
      {/* Iluminación */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Imagen base del producto */}
      <BaseProduct imageUrl={baseImage} />
      
      {/* Diseño aplicado con perspectiva */}
      {designImage && (
        <DesignSurface
          imageUrl={designImage}
          perspectivePoints={perspectivePoints}
          transform={designTransform}
        />
      )}
      
      {/* Controles (solo en modo admin) */}
      {mode === 'admin' && <OrbitControls />}
    </Canvas>
  );
}
```

**Componentes internos**:

```tsx
// Superficie del producto base
function BaseProduct({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(TextureLoader, imageUrl);
  
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[4, 3]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// Superficie con el diseño y perspectiva
function DesignSurface({ 
  imageUrl, 
  perspectivePoints, 
  transform 
}: DesignSurfaceProps) {
  const texture = useLoader(TextureLoader, imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      // Aplicar transformación 3D basada en perspectivePoints
      applyPerspectiveTransform(meshRef.current, perspectivePoints);
    }
  }, [perspectivePoints]);
  
  return (
    <mesh 
      ref={meshRef}
      position={[transform.position.x, transform.position.y, 0.01]}
      rotation={[0, 0, transform.rotation]}
      scale={transform.scale}
    >
      <planeGeometry args={[2, 1.5]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={1}
      />
    </mesh>
  );
}
```

---

### 3. ClientMockupView.tsx

**Interfaz simplificada para clientes**:

```tsx
export function ClientMockupView({ productId }: { productId: number }) {
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const template = useMockupTemplate(productId);
  
  return (
    <div className="mockup-client-view">
      {/* Header */}
      <div className="header">
        <h2>Visualiza tu Personalización</h2>
        <p>Sube tu diseño y ve cómo quedará en el producto real</p>
      </div>
      
      {/* Canvas 3D */}
      <div className="canvas-container">
        <MockupCanvas
          baseImage={template.baseImageUrl}
          designImage={designImage}
          perspectivePoints={template.perspectiveConfig}
          designTransform={{ scale, rotation, position }}
          mode="client"
        />
      </div>
      
      {/* Controles simples */}
      <div className="controls">
        <DesignUploader onUpload={setDesignImage} />
        
        <div className="slider-group">
          <label>Tamaño</label>
          <input 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="slider-group">
          <label>Rotación</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            step="1"
            value={rotation}
            onChange={(e) => setRotation(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="actions">
          <button onClick={handleReset}>Resetear</button>
          <button onClick={handleAddToCart}>Agregar al Carrito</button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. AdminMockupView.tsx

**Interfaz profesional para administradores**:

```tsx
export function AdminMockupView() {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [perspectivePoints, setPerspectivePoints] = useState<PerspectiveConfig>({
    topLeft: { x: 15, y: 20 },
    topRight: { x: 85, y: 20 },
    bottomRight: { x: 90, y: 40 },
    bottomLeft: { x: 10, y: 40 },
  });
  
  return (
    <div className="mockup-admin-view">
      {/* Dos columnas: Controles + Canvas */}
      <div className="admin-layout">
        
        {/* Panel de Controles */}
        <div className="controls-panel">
          <h2>Configuración de Mockup</h2>
          
          {/* Upload de mockup base */}
          <section>
            <h3>Imagen Base</h3>
            <DesignUploader 
              label="Sube la foto del producto vacío"
              onUpload={setBaseImage}
            />
          </section>
          
          {/* Upload de diseño */}
          <section>
            <h3>Diseño de Ejemplo</h3>
            <DesignUploader 
              label="Sube el diseño plano"
              onUpload={setDesignImage}
            />
          </section>
          
          {/* Editor de perspectiva */}
          <section>
            <h3>Puntos de Perspectiva</h3>
            <PerspectiveEditor
              points={perspectivePoints}
              onChange={setPerspectivePoints}
              baseImage={baseImage}
            />
          </section>
          
          {/* Configuración de cámara 3D */}
          <section>
            <h3>Configuración 3D</h3>
            <CameraConfigEditor />
          </section>
          
          {/* Acciones */}
          <div className="actions">
            <button onClick={handlePreview}>Vista Previa</button>
            <button onClick={handleSaveTemplate}>Guardar Template</button>
            <button onClick={handleExportImage}>Exportar Imagen</button>
          </div>
        </div>
        
        {/* Canvas 3D */}
        <div className="canvas-panel">
          <MockupCanvas
            baseImage={baseImage}
            designImage={designImage}
            perspectivePoints={perspectivePoints}
            designTransform={{ scale: 1, rotation: 0, position: { x: 0, y: 0 } }}
            mode="admin"
          />
        </div>
        
      </div>
    </div>
  );
}
```

---

### 5. PerspectiveEditor.tsx

**Editor visual de puntos de perspectiva**:

```tsx
interface PerspectiveEditorProps {
  points: PerspectiveConfig;
  onChange: (points: PerspectiveConfig) => void;
  baseImage: string | null;
}

export function PerspectiveEditor({ 
  points, 
  onChange, 
  baseImage 
}: PerspectiveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  
  // Dibujar imagen base y puntos
  useEffect(() => {
    if (!canvasRef.current || !baseImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      // Dibujar imagen
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Dibujar puntos de perspectiva
      drawPerspectivePoints(ctx, points, canvas.width, canvas.height);
      
      // Dibujar líneas conectando los puntos
      drawPerspectiveLines(ctx, points, canvas.width, canvas.height);
    };
    img.src = baseImage;
  }, [baseImage, points]);
  
  // Manejo de arrastre de puntos
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Detectar qué punto está siendo arrastrado
    const clickedPoint = detectClickedPoint(x, y, points);
    if (clickedPoint) {
      setDraggingPoint(clickedPoint);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingPoint || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Actualizar punto
    onChange({
      ...points,
      [draggingPoint]: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
    });
  };
  
  const handleMouseUp = () => {
    setDraggingPoint(null);
  };
  
  return (
    <div className="perspective-editor">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: draggingPoint ? 'grabbing' : 'grab' }}
      />
      
      {/* Inputs numéricos para ajuste fino */}
      <div className="point-inputs">
        {Object.entries(points).map(([key, point]) => (
          <div key={key} className="point-input-group">
            <label>{key}</label>
            <input 
              type="number" 
              value={point.x.toFixed(1)} 
              onChange={(e) => updatePoint(key, 'x', parseFloat(e.target.value))}
            />
            <input 
              type="number" 
              value={point.y.toFixed(1)} 
              onChange={(e) => updatePoint(key, 'y', parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧮 ALGORITMOS DE TRANSFORMACIÓN

### perspectiveTransform.ts

```typescript
import * as THREE from 'three';

export interface PerspectiveConfig {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

/**
 * Aplica transformación de perspectiva a un mesh de Three.js
 */
export function applyPerspectiveTransform(
  mesh: THREE.Mesh,
  perspectivePoints: PerspectiveConfig,
  canvasWidth: number,
  canvasHeight: number
) {
  // Convertir puntos de porcentaje a coordenadas del canvas
  const tl = percentToCoords(perspectivePoints.topLeft, canvasWidth, canvasHeight);
  const tr = percentToCoords(perspectivePoints.topRight, canvasWidth, canvasHeight);
  const br = perspectivePoints.bottomRight, canvasWidth, canvasHeight);
  const bl = percentToCoords(perspectivePoints.bottomLeft, canvasWidth, canvasHeight);
  
  // Calcular centro del cuadrilátero
  const centerX = (tl.x + tr.x + br.x + bl.x) / 4;
  const centerY = (tl.y + tr.y + br.y + bl.y) / 4;
  
  // Calcular dimensiones
  const width = Math.abs(tr.x - tl.x);
  const height = Math.abs(bl.y - tl.y);
  
  // Calcular rotación en Z (basada en la inclinación superior)
  const rotationZ = Math.atan2(tr.y - tl.y, tr.x - tl.x);
  
  // Calcular rotación en Y (perspectiva horizontal)
  const leftHeight = Math.abs(bl.y - tl.y);
  const rightHeight = Math.abs(br.y - tr.y);
  const rotationY = Math.atan2(rightHeight - leftHeight, width);
  
  // Calcular rotación en X (perspectiva vertical)
  const topWidth = Math.abs(tr.x - tl.x);
  const bottomWidth = Math.abs(br.x - bl.x);
  const rotationX = Math.atan2(bottomWidth - topWidth, height);
  
  // Aplicar transformaciones al mesh
  mesh.position.set(centerX, centerY, 0);
  mesh.rotation.set(rotationX, rotationY, rotationZ);
  mesh.scale.set(width, height, 1);
  
  // Ajustar geometría para que se vea correcta
  if (mesh.geometry instanceof THREE.PlaneGeometry) {
    mesh.geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    
    // Deformar vértices para perspectiva precisa
    const vertices = mesh.geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const y = vertices.getY(i);
      
      // Interpolación bilineal de perspectiva
      const newPos = bilinearInterpolation(
        { x, y },
        tl, tr, br, bl
      );
      
      vertices.setXY(i, newPos.x, newPos.y);
    }
    vertices.needsUpdate = true;
  }
}

/**
 * Interpolación bilineal para transformación de perspectiva
 */
function bilinearInterpolation(
  uv: { x: number; y: number },
  tl: Point, tr: Point, br: Point, bl: Point
): Point {
  const u = (uv.x + 1) / 2; // Normalizar de [-1,1] a [0,1]
  const v = (uv.y + 1) / 2;
  
  const top = lerp(tl, tr, u);
  const bottom = lerp(bl, br, u);
  
  return lerp(top, bottom, v);
}

function lerp(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  };
}

function percentToCoords(
  point: { x: number; y: number },
  width: number,
  height: number
): Point {
  return {
    x: (point.x / 100) * width,
    y: (point.y / 100) * height
  };
}
```

---

## 💾 GESTIÓN DE ESTADO

### mockupStore.ts (Zustand)

```typescript
import create from 'zustand';

interface MockupState {
  // Modo actual
  mode: 'client' | 'admin';
  
  // Imágenes
  baseImage: string | null;
  designImage: string | null;
  
  // Template actual
  currentTemplate: MockupTemplate | null;
  
  // Transformaciones
  designTransform: {
    scale: number;
    rotation: number;
    position: { x: number; y: number };
  };
  
  // Perspectiva (admin mode)
  perspectivePoints: PerspectiveConfig;
  
  // Estado de la UI
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setMode: (mode: 'client' | 'admin') => void;
  setBaseImage: (url: string) => void;
  setDesignImage: (url: string) => void;
  setCurrentTemplate: (template: MockupTemplate) => void;
  updateDesignTransform: (transform: Partial<MockupState['designTransform']>) => void;
  updatePerspectivePoints: (points: Partial<PerspectiveConfig>) => void;
  reset: () => void;
  
  // Operaciones asíncronas
  loadTemplate: (templateId: number) => Promise<void>;
  saveTemplate: (template: Partial<MockupTemplate>) => Promise<void>;
  exportMockup: () => Promise<string>;
}

export const useMockupStore = create<MockupState>((set, get) => ({
  mode: 'client',
  baseImage: null,
  designImage: null,
  currentTemplate: null,
  designTransform: {
    scale: 1,
    rotation: 0,
    position: { x: 0, y: 0 }
  },
  perspectivePoints: {
    topLeft: { x: 15, y: 20 },
    topRight: { x: 85, y: 20 },
    bottomRight: { x: 90, y: 40 },
    bottomLeft: { x: 10, y: 40 }
  },
  isLoading: false,
  error: null,
  
  setMode: (mode) => set({ mode }),
  setBaseImage: (url) => set({ baseImage: url }),
  setDesignImage: (url) => set({ designImage: url }),
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  
  updateDesignTransform: (transform) => set((state) => ({
    designTransform: { ...state.designTransform, ...transform }
  })),
  
  updatePerspectivePoints: (points) => set((state) => ({
    perspectivePoints: { ...state.perspectivePoints, ...points }
  })),
  
  reset: () => set({
    designImage: null,
    designTransform: { scale: 1, rotation: 0, position: { x: 0, y: 0 } }
  }),
  
  loadTemplate: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/mockup/templates/${templateId}`);
      const template = await response.json();
      set({ 
        currentTemplate: template,
        baseImage: template.baseImageUrl,
        perspectivePoints: template.perspectiveConfig,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  saveTemplate: async (template) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/mockup/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      const saved = await response.json();
      set({ currentTemplate: saved, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  exportMockup: async () => {
    // Capturar el canvas y exportar como imagen
    // Implementación depende del canvas (Three.js o Fabric)
    return 'data:image/png;base64,...';
  }
}));
```

---

## 🔌 API ENDPOINTS

### GET /api/mockup/templates/:id

**Descripción**: Obtener configuración de un template de mockup

**Response**:
```typescript
{
  id: number;
  name: string;
  baseImageUrl: string;
  perspectiveConfig: PerspectiveConfig;
  surfaceConfig: SurfaceConfig;
  cameraConfig: CameraConfig;
}
```

---

### POST /api/mockup/templates

**Descripción**: Guardar nuevo template de mockup

**Request**:
```typescript
{
  productId: number;
  name: string;
  baseImageUrl: string;
  perspectiveConfig: PerspectiveConfig;
  surfaceConfig?: SurfaceConfig;
  cameraConfig?: CameraConfig;
}
```

**Response**: Template creado con ID

---

### PUT /api/mockup/templates/:id

**Descripción**: Actualizar template existente

---

### POST /api/mockup/export

**Descripción**: Exportar mockup generado como imagen

**Request**:
```typescript
{
  baseImage: string;
  designImage: string;
  perspectivePoints: PerspectiveConfig;
  transform: TransformConfig;
}
```

**Response**:
```typescript
{
  imageUrl: string; // URL de la imagen generada
}
```

---

## 🎨 INTEGRACIÓN CON PÁGINAS EXISTENTES

### En la Página de Producto

```tsx
// src/pages/producto/[slug].astro

---
import { getProductBySlug } from '@/lib/services/ProductService';
import MockupGenerator from '@/components/mockup/MockupGenerator';

const { slug } = Astro.params;
const product = await getProductBySlug(slug);

const hasMockup = product.allowsMockup && product.mockupTemplateId;
---

<Layout>
  <div class="product-page">
    
    {/* Información del producto */}
    <ProductInfo product={product} />
    
    {/* Generador de mockups (si el producto lo permite) */}
    {hasMockup && (
      <section class="mockup-section">
        <h3>Visualiza tu Personalización</h3>
        <MockupGenerator 
          mode="client"
          productId={product.id}
          client:load
        />
      </section>
    )}
    
    {/* Resto de la página */}
  </div>
</Layout>
```

---

### En el Panel Admin

```tsx
// src/pages/admin/mockups.astro

---
import AdminLayout from '@/layouts/AdminLayout.astro';
import MockupGenerator from '@/components/mockup/MockupGenerator';
---

<AdminLayout>
  <div class="admin-mockups-page">
    <h1>Generador de Mockups</h1>
    
    <MockupGenerator 
      mode="admin"
      client:load
    />
    
    {/* Lista de templates existentes */}
    <MockupTemplateList />
  </div>
</AdminLayout>
```

---

## 📱 DISEÑO RESPONSIVE

### Mobile (< 768px)
- Canvas ocupa 100% del ancho
- Controles debajo del canvas (vertical)
- Sliders con touch support
- Botones grandes (min 44x44px)

### Tablet (768px - 1024px)
- Canvas 60%, controles 40%
- Layout de dos columnas

### Desktop (> 1024px)
- Canvas 70%, controles 30%
- Editor de perspectiva más grande
- Múltiples vistas simultáneas (admin)

---

## ⚡ OPTIMIZACIONES DE PERFORMANCE

### Lazy Loading
- Cargar Three.js solo cuando se necesite
- Code splitting por modo (client/admin)

```tsx
// Carga condicional
const MockupCanvas = lazy(() => import('./MockupCanvas'));

{showMockup && (
  <Suspense fallback={<LoadingSpinner />}>
    <MockupCanvas />
  </Suspense>
)}
```

### Imágenes Optimizadas
- WebP con fallback a JPG
- Lazy load de texturas
- Comprimir imágenes antes de subir

### Memoización
```tsx
const memoizedCanvas = useMemo(() => (
  <MockupCanvas
    baseImage={baseImage}
    designImage={designImage}
    perspectivePoints={perspectivePoints}
  />
), [baseImage, designImage, perspectivePoints]);
```

---

## 🧪 TESTING

### Tests Unitarios

```typescript
// mockupEngine.test.ts

describe('Perspective Transform', () => {
  it('should correctly convert percentage points to canvas coordinates', () => {
    const point = { x: 50, y: 50 };
    const result = percentToCoords(point, 800, 600);
    expect(result).toEqual({ x: 400, y: 300 });
  });
  
  it('should apply perspective transformation to mesh', () => {
    const mesh = new THREE.Mesh();
    const points = {
      topLeft: { x: 10, y: 10 },
      topRight: { x: 90, y: 10 },
      bottomRight: { x: 90, y: 90 },
      bottomLeft: { x: 10, y: 90 }
    };
    
    applyPerspectiveTransform(mesh, points, 800, 600);
    
    expect(mesh.rotation.z).toBeCloseTo(0, 2);
    expect(mesh.scale.x).toBeGreaterThan(0);
  });
});
```

### Tests de Integración

```typescript
// MockupGenerator.test.tsx

describe('MockupGenerator Component', () => {
  it('should render in client mode', () => {
    render(<MockupGenerator mode="client" productId={1} />);
    expect(screen.getByText(/visualiza tu personalización/i)).toBeInTheDocument();
  });
  
  it('should allow uploading design image', async () => {
    const { getByLabelText } = render(<MockupGenerator mode="client" />);
    const file = new File(['design'], 'design.png', { type: 'image/png' });
    
    const input = getByLabelText(/sube tu diseño/i);
    await userEvent.upload(input, file);
    
    expect(await screen.findByAltText(/diseño/i)).toBeInTheDocument();
  });
});
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup (1-2 días)
- [ ] Instalar dependencias (Three.js, React Three Fiber)
- [ ] Crear estructura de carpetas
- [ ] Definir types TypeScript
- [ ] Crear schema de base de datos
- [ ] Migrar schema

### Fase 2: Componentes Básicos (2-3 días)
- [ ] MockupCanvas básico con Three.js
- [ ] DesignUploader component
- [ ] Controles de transformación (escala, rotación)
- [ ] Store de Zustand

### Fase 3: Modo Cliente (2-3 días)
- [ ] ClientMockupView completo
- [ ] Integración con página de producto
- [ ] Drag & drop de diseño
- [ ] Preview en tiempo real
- [ ] Exportar mockup

### Fase 4: Modo Admin (3-4 días)
- [ ] AdminMockupView completo
- [ ] PerspectiveEditor con puntos arrastrables
- [ ] Guardar templates en DB
- [ ] Cargar templates existentes
- [ ] Panel admin de mockups

### Fase 5: Algoritmos 3D (2-3 días)
- [ ] Implementar transformación de perspectiva precisa
- [ ] Interpolación bilineal
- [ ] Deformación de vértices
- [ ] Optimización de performance

### Fase 6: API y Backend (1-2 días)
- [ ] Endpoints CRUD para templates
- [ ] Upload de imágenes
- [ ] Procesamiento de imágenes
- [ ] Cache de mockups generados

### Fase 7: UI/UX Polish (2-3 días)
- [ ] Diseño responsive
- [ ] Animaciones
- [ ] Loading states
- [ ] Error handling
- [ ] Tooltips y guías

### Fase 8: Testing y Optimización (2-3 días)
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Optimización de performance
- [ ] Lazy loading
- [ ] Code splitting

### Fase 9: Documentación (1 día)
- [ ] Documentar componentes
- [ ] Guía de uso para admin
- [ ] README técnico

**Tiempo estimado total: 15-25 días**

---

## 🚀 ROADMAP DE FUNCIONALIDADES FUTURAS

### v1.1 - Mejoras Básicas
- Galería de diseños predefinidos
- Plantillas de texto personalizables
- Múltiples vistas del producto (frontal, lateral)

### v1.2 - Personalización Avanzada
- Editor de texto integrado
- Selector de colores en tiempo real
- Efectos (metalizado, relieve)

### v1.3 - Colaboración
- Compartir mockup por link
- Solicitar aprobación del cliente
- Historial de mockups por pedido

### v2.0 - AR (Realidad Aumentada)
- Ver el producto en 3D usando la cámara
- Integración con AR.js o Model Viewer

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación Técnica
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Three.js**: https://threejs.org/docs/
- **Fabric.js**: http://fabricjs.com/docs/
- **Perspective Transform Algorithm**: https://en.wikipedia.org/wiki/Perspective_transform

### Ejemplos de Referencia
- **Canva**: Sistema de mockups
- **Placeit**: Generador de mockups profesional
- **Smartmockups**: Templates de productos

### Librerías Útiles
- **@react-three/drei**: Helpers para React Three Fiber
- **@react-three/postprocessing**: Efectos visuales
- **leva**: Panel de controles para Three.js
- **gl-matrix**: Operaciones matriciales optimizadas

---

## 🎯 CRITERIOS DE ÉXITO

### Métricas de Producto
- 80%+ de productos con mockup disponible
- < 3 segundos para generar mockup
- 90%+ de clientes satisfechos con preview
- 30%+ aumento en conversión de productos con mockup

### Métricas Técnicas
- Lighthouse Performance > 85
- Time to Interactive < 3s
- Canvas FPS > 30
- Zero CLS (Cumulative Layout Shift)

### Métricas de Negocio
- Reducción 50% de consultas por WhatsApp sobre diseños
- Reducción 30% de devoluciones por expectativas
- Aumento 20% en ticket promedio

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### Upload de Imágenes
- Validar tipo de archivo (solo PNG, JPG, SVG)
- Limitar tamaño máximo (5MB)
- Sanitizar nombres de archivo
- Escanear por malware

### Storage de Imágenes
- Almacenar en CDN (Cloudflare, Cloudinary)
- URLs firmadas para acceso temporal
- Limpieza automática de imágenes temporales

### Rate Limiting
- Máximo 10 generaciones de mockup por minuto
- Máximo 50 uploads por hora

---

## ⚙️ CONFIGURACIÓN DE ENTORNO

### Variables de Entorno

```env
# Mockup Configuration
MOCKUP_STORAGE_PROVIDER=cloudinary
MOCKUP_STORAGE_URL=https://res.cloudinary.com/decomoi/
MOCKUP_MAX_FILE_SIZE=5242880
MOCKUP_ALLOWED_FORMATS=png,jpg,jpeg,svg
MOCKUP_CACHE_TTL=86400

# Cloudinary (ejemplo)
CLOUDINARY_CLOUD_NAME=decomoi
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🎨 ESTILOS Y THEMING

### Integración con Tailwind

```tsx
// Ejemplo de componente con estilos de Deco Moi

<div className="mockup-generator">
  {/* Header con colores de marca */}
  <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-t-lg">
    <h2 className="text-2xl font-montserrat font-bold">
      Visualiza tu Personalización
    </h2>
  </div>
  
  {/* Canvas */}
  <div className="bg-off-white p-4 rounded-b-lg shadow-lg">
    <MockupCanvas />
  </div>
  
  {/* Controles con diseño de Deco Moi */}
  <div className="controls space-y-4 p-6">
    <button className="btn-primary w-full">
      Aplicar Diseño
    </button>
  </div>
</div>
```

### CSS Personalizado

```css
/* mockup.css */

.mockup-canvas {
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.mockup-canvas:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
}

.perspective-point {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: grab;
  transition: all 0.2s;
}

.perspective-point:hover {
  transform: scale(1.3);
  background: var(--accent);
}

.perspective-point:active {
  cursor: grabbing;
}
```

---

## 📞 CONTACTO Y SOPORTE

Para consultas técnicas sobre esta implementación:
- **Proyecto**: Deco Moi E-commerce
- **Stack**: Antigravity (Astro + React + TypeScript)
- **Desarrollador**: [Tu equipo]

---

**FIN DE LA ESPECIFICACIÓN TÉCNICA**

*Documento creado para el proyecto Deco Moi - Antigravity*
*Última actualización: 14 de febrero de 2026*
*Versión: 1.0*
