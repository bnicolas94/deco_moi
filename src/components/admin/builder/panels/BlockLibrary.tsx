import React from 'react';
import { useBuilderStore } from '../store/BuilderState';
import { Type, Image, List, HelpCircle, Columns, Layout, PlusCircle, ShoppingBag, MessageSquare, Phone, Mail } from 'lucide-react';

const blockTypes = [
  { type: 'hero', name: 'Hero / Banner', icon: Layout },
  { type: 'richtext', name: 'Texto Enriquecido', icon: Type },
  { type: 'image_text', name: 'Imagen + Texto', icon: Image },
  { type: 'product_grid', name: 'Grilla de Productos', icon: ShoppingBag },
  { type: 'features', name: 'Tarjetas / Features', icon: Columns },
  { type: 'faq', name: 'FAQ / Acordeón', icon: HelpCircle },
  { type: 'testimonials', name: 'Testimonios', icon: MessageSquare },
  { type: 'whatsapp_cta', name: 'Botón WhatsApp', icon: Phone },
  { type: 'contact_form', name: 'Form. de Contacto', icon: Mail },
  { type: 'spacer', name: 'Separador', icon: PlusCircle },
];

export default function BlockLibrary() {
  const { addBlock } = useBuilderStore();

  return (
    <div className="flex flex-col gap-3">
      {blockTypes.map(({ type, name, icon: Icon }) => (
        <button
          key={type}
          onClick={() => addBlock(type)}
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-brand-primary hover:shadow-sm transition-all text-left group"
        >
          <div className="bg-gray-50 p-2 rounded-md group-hover:bg-brand-primary/10 transition-colors">
            <Icon className="w-5 h-5 text-gray-500 group-hover:text-brand-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{name}</span>
        </button>
      ))}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Haz clic para agregar un bloque al final de la página. (Drag & drop próximamente)
      </p>
    </div>
  );
}
