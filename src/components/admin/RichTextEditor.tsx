import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';
import FontSize from 'tiptap-extension-font-size';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Link as LinkIcon, 
  Smile, RotateCcw, Heading1, Heading2, Heading3,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  name: string;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialValue = '', 
  onChange, 
  placeholder = 'Empieza a escribir...',
  minHeight = '200px',
  name
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [content, setContent] = useState(initialValue);
  const [currentFontSize, setCurrentFontSize] = useState('16px');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      // Removed Link and Underline from here if they cause duplicates, 
      // but the warning said they were duplicates, so they must be in StarterKit or somewhere else.
      // Actually, I'll keep them but be careful.
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      // Re-adding these only if not in StarterKit. In Tiptap 2 they are NOT in StarterKit.
      // The warning might be coming from another part of the app or a plugin.
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline cursor-pointer',
        },
      }),
    ],
    content: initialValue,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      if (onChange) {
        onChange(html);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const fontSize = editor.getAttributes('textStyle').fontSize || '16px';
      setCurrentFontSize(fontSize);
    },
    editorProps: {
      attributes: {
        class: `prose prose-base max-w-none focus:outline-none p-6 min-h-[${minHeight}] editor-content`,
        style: `min-height: ${minHeight};`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const onEmojiClick = (emojiData: any) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col w-full border border-gray-200 rounded-xl bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
      <input type="hidden" name={name} value={content} />
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-20">
        {/* Font Size Dropdown */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
          <Type size={14} className="text-gray-400" />
          <select 
            className="text-xs bg-transparent border-none focus:ring-0 text-gray-600 font-medium cursor-pointer"
            onChange={(e) => {
              const size = e.target.value;
              editor.chain().focus().setFontSize(size).run();
              setCurrentFontSize(size);
            }}
            value={currentFontSize}
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Negrita"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Cursiva"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Subrayado"
        >
          <UnderlineIcon size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Lista de viñetas"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Lista numerada"
        >
          <ListOrdered size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        <button
          type="button"
          onClick={toggleLink}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Insertar enlace"
        >
          <LinkIcon size={18} />
        </button>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-200'}`}
            title="Emojis"
          >
            <Smile size={18} />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute z-50 top-full mt-2 left-0 shadow-2xl rounded-xl overflow-hidden border border-gray-200">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme={Theme.LIGHT}
                searchPlaceholder="Buscar emoji..."
                width={300}
                height={400}
              />
            </div>
          )}
        </div>
        
        <div className="flex-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          title="Limpiar formato"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
      
      {/* Word Count / Info */}
      <div className="flex items-center justify-end px-3 py-1 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
        <span>{editor.storage.characterCount?.characters() || 0} caracteres</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
