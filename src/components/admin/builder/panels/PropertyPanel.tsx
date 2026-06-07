import React from 'react';
import { useBuilderStore } from '../store/BuilderState';
import { Trash2, Copy, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

export default function PropertyPanel() {
  const { blocks, selectedBlockId, updateBlock, removeBlock, duplicateBlock, toggleVisibility, reorderBlocks } = useBuilderStore();
  
  const block = blocks.find(b => b.id === selectedBlockId);
  
  if (!block) {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-gray-400 font-medium text-lg">?</span>
        </div>
        <p className="text-sm text-gray-500">Selecciona un bloque en el canvas para editar sus propiedades</p>
      </div>
    );
  }

  const index = blocks.findIndex(b => b.id === selectedBlockId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="font-medium text-sm text-gray-900 capitalize px-2 py-1 bg-gray-100 rounded text-xs">{block.type}</h3>
        <div className="flex gap-1">
          <button onClick={() => reorderBlocks(index, index - 1)} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => reorderBlocks(index, index + 1)} disabled={index === blocks.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => toggleVisibility(block.id)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
            {block.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={() => duplicateBlock(block.id)} className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => removeBlock(block.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(block.props).map(([key, value]) => {
          // Simple heuristic renderer for MVP
          if (typeof value === 'boolean') {
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={(e) => updateBlock(block.id, { [key]: e.target.checked })}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-700 capitalize">{key}</span>
              </label>
            );
          }
          if (typeof value === 'number') {
            return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
                <input 
                  type="number" 
                  value={value} 
                  onChange={(e) => updateBlock(block.id, { [key]: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            );
          }
          if (key === 'content') {
             // For richtext content, a textarea for now (Tiptap pending)
             return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
                <textarea 
                  value={value as string} 
                  onChange={(e) => updateBlock(block.id, { [key]: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-brand-primary outline-none resize-y"
                />
              </div>
            );
          }
          
          return (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
              <input 
                type="text" 
                value={value as string} 
                onChange={(e) => updateBlock(block.id, { [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
