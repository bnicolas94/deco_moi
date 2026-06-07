import React, { useEffect } from 'react';
import { useBuilderStore } from './store/BuilderState';
import { ArrowLeft, ExternalLink, Save, Check, RefreshCw, AlertCircle, Smartphone, Monitor } from 'lucide-react';
import BlockLibrary from './panels/BlockLibrary';
import Canvas from './panels/Canvas';
import PropertyPanel from './panels/PropertyPanel';

export default function PageEditor({ initialData }: { initialData: any }) {
  const { initPage, saveStatus, saveBlocks, viewMode, setViewMode, isPreview, setIsPreview } = useBuilderStore();

  useEffect(() => {
    if (initialData) {
      initPage(initialData.id, initialData.blocks || []);
    }
  }, [initialData, initPage]);

  // Debounced auto-save effect
  useEffect(() => {
    const unsubscribe = useBuilderStore.subscribe((state, prevState) => {
      // Trigger save if blocks changed and not currently saving
      if (state.blocks !== prevState.blocks && state.saveStatus === 'idle') {
        const timer = setTimeout(() => {
          useBuilderStore.getState().saveBlocks();
        }, 1000); // 1s debounce
        return () => clearTimeout(timer);
      }
    });
    return unsubscribe;
  }, []);

  const togglePublish = async () => {
    if (!initialData.id) return;
    try {
      const res = await fetch(`/api/pages/${initialData.id}/publish`, { method: 'PUT' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      alert("Error al publicar");
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden text-gray-900">
      {/* Top Navbar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/admin/paginas" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold truncate max-w-[200px]">{initialData.title}</h1>
            <a href={`/${initialData.slug}?preview=true`} target="_blank" className="text-xs text-brand-primary flex items-center gap-1 hover:underline">
              /{initialData.slug} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${!isPreview ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${isPreview ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Preview
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {saveStatus === 'saved' && <><Check className="w-3.5 h-3.5 text-green-500" /> <span className="text-gray-500">Guardado</span></>}
            {saveStatus === 'saving' && <><RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" /> <span className="text-gray-500">Guardando...</span></>}
            {saveStatus === 'error' && <><AlertCircle className="w-3.5 h-3.5 text-red-500" /> <span className="text-red-500">Error al guardar</span></>}
          </div>

          <button
            onClick={() => saveBlocks()}
            className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title="Guardar Borrador"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={togglePublish}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              initialData.status === 'published' 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-brand-primary text-white hover:bg-brand-secondary'
            }`}
          >
            {initialData.status === 'published' ? 'Despublicar' : 'Publicar'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Block Library */}
        <div className={`w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full z-10 transition-all ${isPreview ? '-ml-64 hidden' : ''}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm">Bloques Disponibles</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <BlockLibrary />
          </div>
        </div>

        {/* Center: Canvas / Iframe Preview */}
        <div className="flex-1 bg-gray-100 relative flex items-center justify-center p-4 md:p-8 overflow-y-auto">
           {isPreview ? (
             <div className={`bg-white shadow-xl transition-all duration-300 mx-auto ${viewMode === 'mobile' ? 'w-[375px] h-[812px] rounded-[2.5rem] border-[14px] border-gray-900 overflow-hidden relative' : 'w-full max-w-6xl h-full rounded-md border border-gray-200'}`}>
               {viewMode === 'mobile' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10"></div>}
               <iframe 
                 key={saveStatus} // Hack simple para recargar el iframe al guardar
                 src={`/${initialData.slug}?preview=true`} 
                 className="w-full h-full border-0 bg-white pointer-events-auto"
                 title="Preview"
               />
             </div>
           ) : (
             <Canvas />
           )}
        </div>

        {/* Right Panel: Properties */}
        <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col h-full z-10">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm">Propiedades</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <PropertyPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
