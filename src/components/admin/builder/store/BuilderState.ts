import { create } from 'zustand';
import type { PageBlock } from '@/lib/blocks';

interface BuilderState {
  pageId: string | null;
  blocks: PageBlock[];
  selectedBlockId: string | null;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  viewMode: 'desktop' | 'mobile';
  isPreview: boolean;
  
  // Actions
  initPage: (id: string, initialBlocks: PageBlock[]) => void;
  setBlocks: (blocks: PageBlock[]) => void;
  selectBlock: (id: string | null) => void;
  addBlock: (type: string, index?: number) => void;
  updateBlock: (id: string, props: any) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  toggleVisibility: (id: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  setViewMode: (mode: 'desktop' | 'mobile') => void;
  setIsPreview: (isPreview: boolean) => void;
  
  // API Sync
  saveBlocks: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useBuilderStore = create<BuilderState>((set, get) => ({
  pageId: null,
  blocks: [],
  selectedBlockId: null,
  isSaving: false,
  saveStatus: 'idle',
  viewMode: 'desktop',
  isPreview: false,

  initPage: (id, initialBlocks) => {
    set({ pageId: id, blocks: initialBlocks, saveStatus: 'saved' });
  },

  setBlocks: (blocks) => set({ blocks }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  addBlock: (type, index) => {
    const newBlock: PageBlock = {
      id: generateId(),
      type,
      order: 0,
      isVisible: true,
      props: getDefaultPropsForType(type)
    };

    set((state) => {
      const newBlocks = [...state.blocks];
      if (index !== undefined) {
        newBlocks.splice(index, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }
      
      // Update order
      newBlocks.forEach((b, i) => b.order = i);
      
      return { blocks: newBlocks, selectedBlockId: newBlock.id, saveStatus: 'idle' };
    });
    
    get().saveBlocks();
  },

  updateBlock: (id, props) => {
    set((state) => ({
      blocks: state.blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...props } } : b),
      saveStatus: 'idle'
    }));
    // Debounced autosave should trigger in UI, or we trigger it here directly
  },

  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i })),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      saveStatus: 'idle'
    }));
    get().saveBlocks();
  },

  duplicateBlock: (id) => {
    set((state) => {
      const index = state.blocks.findIndex(b => b.id === id);
      if (index === -1) return state;
      
      const source = state.blocks[index];
      const newBlock: PageBlock = {
        ...source,
        id: generateId(),
      };
      
      const newBlocks = [...state.blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      newBlocks.forEach((b, i) => b.order = i);
      
      return { blocks: newBlocks, selectedBlockId: newBlock.id, saveStatus: 'idle' };
    });
    get().saveBlocks();
  },

  toggleVisibility: (id) => {
    set((state) => ({
      blocks: state.blocks.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b),
      saveStatus: 'idle'
    }));
    get().saveBlocks();
  },

  reorderBlocks: (fromIndex, toIndex) => {
    set((state) => {
      const newBlocks = [...state.blocks];
      const [moved] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, moved);
      newBlocks.forEach((b, i) => b.order = i);
      return { blocks: newBlocks, saveStatus: 'idle' };
    });
    get().saveBlocks();
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setIsPreview: (isPreview) => set({ isPreview }),

  saveBlocks: async () => {
    const { pageId, blocks } = get();
    if (!pageId) return;

    set({ isSaving: true, saveStatus: 'saving' });
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      set({ isSaving: false, saveStatus: 'saved' });
    } catch (e) {
      console.error(e);
      set({ isSaving: false, saveStatus: 'error' });
    }
  }
}));

function getDefaultPropsForType(type: string): any {
  switch (type) {
    case 'hero':
      return { title: 'Título principal', align: 'center', overlayOpacity: 50, minHeight: 400 };
    case 'richtext':
      return { content: '<p>Empieza a escribir aquí...</p>', maxWidth: 'normal', align: 'left' };
    case 'spacer':
      return { height: 50, showLine: false };
    case 'image_text':
      return { title: 'Imagen y Texto', content: '<p>Descripción aquí...</p>', image: '', imagePosition: 'left' };
    case 'features':
      return { title: 'Nuestras Ventajas', features: [] };
    case 'faq':
      return { title: 'Preguntas Frecuentes', items: [] };
    case 'product_grid':
      return { title: 'Productos Destacados', limit: 4, showCta: true };
    case 'testimonials':
      return { title: 'Testimonios', testimonials: [] };
    case 'whatsapp_cta':
      return { title: '¿Necesitas ayuda?', buttonText: 'Contactar' };
    case 'contact_form':
      return { title: 'Contáctanos' };
    default:
      return {};
  }
}
