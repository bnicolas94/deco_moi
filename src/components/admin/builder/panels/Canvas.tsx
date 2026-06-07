import React from 'react';
import { useBuilderStore } from '../store/BuilderState';
import { MousePointerClick, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBlockItem({ block, isSelected, onSelect }: { block: any, isSelected: boolean, onSelect: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : (!block.isVisible ? 0.5 : 1)
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative group cursor-pointer transition-all border-2 min-h-[80px] flex items-stretch bg-white mb-2 shadow-sm rounded-md
        ${isSelected ? 'border-brand-primary' : 'border-transparent hover:border-gray-300'}
      `}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="w-10 flex items-center justify-center bg-gray-50 border-r border-gray-100 cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors shrink-0 rounded-l-md"
        onClick={(e) => e.stopPropagation()} // Evitar seleccionar cuando se hace drag
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex-1 p-4 relative flex flex-col justify-center overflow-hidden">
         {/* Etiqueta del bloque */}
         <div className={`absolute top-0 right-0 bg-brand-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-20 ${isSelected ? 'opacity-100' : ''}`}>
           {block.type}
         </div>
         
         <h3 className="font-semibold text-gray-700 capitalize">{block.type}</h3>
         <p className="text-xs text-gray-400 mt-1 truncate pr-8">
           {JSON.stringify(block.props).substring(0, 100)}...
         </p>
      </div>
    </div>
  );
}

export default function Canvas() {
  const { blocks, selectedBlockId, selectBlock, viewMode, reorderBlocks } = useBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere 5px de movimiento para iniciar el drag, permitiendo el click normal
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      reorderBlocks(oldIndex, newIndex);
    }
  };

  return (
    <div className={`bg-white shadow-xl transition-all duration-300 mx-auto relative flex flex-col ${viewMode === 'mobile' ? 'w-[375px] h-[812px] rounded-3xl overflow-hidden border-8 border-gray-800' : 'w-full max-w-6xl h-full rounded-md border border-gray-200'}`}>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-4 relative">
        {blocks.length === 0 ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white rounded-md border-2 border-dashed border-gray-200">
            <MousePointerClick className="w-12 h-12 mb-4 opacity-50 text-gray-300" />
            <p className="font-medium text-gray-500">El lienzo está vacío.</p>
            <p className="text-sm mt-1">Haz clic en un bloque desde la librería a la izquierda.</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {blocks.map((block) => (
                  <SortableBlockItem 
                    key={block.id} 
                    block={block} 
                    isSelected={selectedBlockId === block.id} 
                    onSelect={() => selectBlock(block.id)} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

    </div>
  );
}
