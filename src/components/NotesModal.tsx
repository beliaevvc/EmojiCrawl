import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Plus, Bold, Italic, Underline, Link as LinkIcon, List, RotateCcw, ArrowDownRight } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_CONTENT = `<b>Общие ограничения</b>

В одной деке нельзя иметь 2 монстра с перком «Скрытность» 🥷
Количество монстров и карт в деке не менять - 19 константа! 🚫

➜ Чтобы не увеличивать длину забега
➜ Исключение: монстр с перком «Зеркало» с 1 HP 🪞

<b>📊 Перк - Максимальное HP монстра</b>

Скрытность 🥷 ≤ 5
Наследие 👑 ≤ 4
Обезоруживание 🧤 ≤ 5
Пролом 🔨 ≤ 5
Молчание 😶 ≤ 7
Пере-гниль 🍄 ≤ 6
Топот 🐘 ≤ 4
Трупоед 🧟 ≤ 3

• Монстры с 11 HP в базовом билде практически невозможны ❌
➜ Из-за перков общее эффективное HP слишком высокое

• Категории монстров с перками сильно усиливают общую сложность 📈

<b>👹 Боссы и мини-боссы (рекомендации)</b>

<b>Боссы ☠️</b>
Категория: 10 HP
Количество: 3
Имеют: сложные, уникальные, пассивные перки, влияющие на стол

<b>Мини-боссы 😈</b>
- Монстр с не максимальным HP в деке, имеющий уникальный перк, который:

не повторяется в других монстрах
не дублируется внутри категории

<b>📜 Правила:</b>

- Не более 4 мини-боссов в деке
- В деке может быть не более 2 категорий с мини-боссами

<b>Пример:</b>

Категория HP = 4 (2 монстра):
Один получает перк «Скрытность»
Второй автоматически получает другой уникальный перк
= Получаем 2 мини-босса ✅`;

export const NotesModal = ({ onClose }: { onClose: () => void }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
        const saved = localStorage.getItem('skazmor_notes');
        let parsed: Note[] = saved ? JSON.parse(saved) : [];
        
        if (!Array.isArray(parsed)) parsed = [];

        // Ensure Balance note exists
        const hasBalanceNote = parsed.some(n => n.id === 'balance_perks');
        
        if (!hasBalanceNote) {
             // Remove old versions if they exist to update content
             const filtered = parsed.filter(n => n.id !== 'balance_info' && !n.title.includes('Баланс'));
             
             const balanceNote = { id: 'balance_perks', title: 'Баланс Перков (ограничения)', content: DEFAULT_CONTENT };
             return [balanceNote, ...filtered];
        }
        
        // Always update the content of the balance note to the latest version
        const balanceIndex = parsed.findIndex(n => n.id === 'balance_perks');
        if (balanceIndex !== -1) {
             parsed[balanceIndex].content = DEFAULT_CONTENT;
             parsed[balanceIndex].title = 'Баланс Перков (ограничения)';
             // Move to top
             const balanceNote = parsed.splice(balanceIndex, 1)[0];
             return [balanceNote, ...parsed];
        }

        if (parsed.length === 0) {
             return [{ id: 'balance_perks', title: 'Баланс Перков (ограничения)', content: DEFAULT_CONTENT }];
        }

        return parsed;
    } catch (e) {
        return [{ id: 'balance_perks', title: 'Баланс Перков (ограничения)', content: DEFAULT_CONTENT }];
    }
  });
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '1');
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Resize State
  const [size, setSize] = useState({ width: 400, height: 500 });
  const isResizing = useRef(false);
  const dragControls = useDragControls();

  useEffect(() => {
    localStorage.setItem('skazmor_notes', JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content } : n));
    }
  };

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
    setTimeout(checkSelection, 0);
  };

  const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          setToolbarPosition(null);
          return;
      }

      if (!editorRef.current?.contains(selection.anchorNode)) {
          setToolbarPosition(null);
          return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setToolbarPosition({
          top: rect.top - 45,
          left: rect.left + rect.width / 2
      });
  };

  useEffect(() => {
      document.addEventListener('selectionchange', checkSelection);
      return () => document.removeEventListener('selectionchange', checkSelection);
  }, []);

  // Resize Handlers
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    window.addEventListener('pointermove', handleResize);
    window.addEventListener('pointerup', stopResize);
  };

  const handleResize = (e: PointerEvent) => {
    if (!isResizing.current) return;
    setSize(prev => ({
        width: Math.max(300, prev.width + e.movementX),
        height: Math.max(300, prev.height + e.movementY)
    }));
  };

  const stopResize = () => {
    isResizing.current = false;
    window.removeEventListener('pointermove', handleResize);
    window.removeEventListener('pointerup', stopResize);
  };

  const addNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Новая заметка',
      content: ''
    };
    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newNote.id);
  };

  const removeNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (notes.length === 1) return;
    
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    
    if (activeNoteId === id) {
        setActiveNoteId(newNotes[0].id);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: e.target.value } : n));
  }

  useEffect(() => {
    if (editorRef.current && activeNote) {
        if (editorRef.current.innerHTML !== activeNote.content) {
            editorRef.current.innerHTML = activeNote.content;
        }
    }
  }, [activeNoteId]); 

  if (!activeNote) return null;

  return (
    <>
        <motion.div
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-40 top-24 right-10 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95"
        style={{ width: size.width, height: size.height }}
        >
        {/* Header / Tabs */}
        <div 
            className="flex items-center bg-stone-950/80 p-1 border-b border-stone-800 cursor-move select-none"
            onPointerDown={(e) => dragControls.start(e)}
        >
            <div className="flex-1 flex overflow-x-auto scrollbar-hide gap-1 pr-2">
                {notes.map(note => (
                    <div 
                        key={note.id}
                        onClick={() => setActiveNoteId(note.id)}
                        onPointerDown={e => e.stopPropagation()}
                        className={`
                            px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer flex items-center gap-2 min-w-[80px] max-w-[120px] transition-colors
                            ${activeNoteId === note.id ? 'bg-stone-800 text-indigo-300' : 'bg-transparent text-stone-500 hover:bg-stone-800/50 hover:text-stone-300'}
                        `}
                    >
                        <span className="truncate flex-1">{note.title || 'Untitled'}</span>
                        {notes.length > 1 && (
                            <button onClick={(e) => removeNote(e, note.id)} className="hover:text-rose-500 opacity-60 hover:opacity-100">
                                <X size={10} />
                            </button>
                        )}
                    </div>
                ))}
                <button 
                    onClick={addNote} 
                    onPointerDown={e => e.stopPropagation()}
                    className="px-2 text-stone-600 hover:text-indigo-400 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
            
            {/* Reset Size Button */}
            <button 
                onClick={() => setSize({ width: 400, height: 500 })} 
                onPointerDown={e => e.stopPropagation()}
                title="Сбросить размер"
                className="p-2 text-stone-600 hover:text-stone-300 transition-colors mr-1"
            >
                <RotateCcw size={14} />
            </button>

            <button 
                onClick={onClose} 
                onPointerDown={e => e.stopPropagation()}
                className="p-2 text-stone-500 hover:text-stone-100 transition-colors"
            >
                <X size={16} />
            </button>
        </div>

        {/* Title Input */}
        <div className="p-3 border-b border-stone-800 bg-stone-900/50">
            <input 
                value={activeNote.title}
                onChange={handleTitleChange}
                className="w-full bg-transparent text-stone-200 font-bold text-lg outline-none placeholder-stone-600"
                placeholder="Заголовок..."
            />
        </div>

        {/* Editor */}
        <div 
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            onBlur={updateContent}
            className="flex-1 p-4 outline-none text-stone-300 text-sm overflow-y-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&>a]:text-indigo-400 [&>a]:underline selection:bg-indigo-500/30 selection:text-indigo-200"
            style={{ whiteSpace: 'pre-wrap' }}
        />
        
        {/* Footer / Status + Resize Handle */}
        <div className="p-1 bg-stone-950/50 border-t border-stone-800 text-[10px] text-stone-600 flex justify-between items-end px-3 relative">
            <span>Выделите текст для форматирования</span>
            <div className="flex flex-col items-end gap-0.5 mr-4">
                <span>Автосохранение</span>
                <span className="text-[9px] text-stone-700">Локально (видно только вам)</span>
            </div>
            {/* Resize Handle */}
            <div 
                onPointerDown={startResize}
                className="cursor-nwse-resize text-stone-600 hover:text-stone-300 transition-colors p-1 absolute bottom-0 right-0"
            >
                <ArrowDownRight size={16} />
            </div>
        </div>
        </motion.div>

        {/* Floating Toolbar */}
        <AnimatePresence>
            {toolbarPosition && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                    className="fixed z-[45] flex items-center gap-1 p-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl"
                    style={{ 
                        top: toolbarPosition.top,  
                        left: toolbarPosition.left,
                        transform: 'translateX(-50%)'
                    }}
                    onMouseDown={e => e.preventDefault()}
                >
                    <ToolbarBtn icon={<Bold size={14} />} onClick={() => handleCommand('bold')} tooltip="Жирный" />
                    <ToolbarBtn icon={<Italic size={14} />} onClick={() => handleCommand('italic')} tooltip="Курсив" />
                    <ToolbarBtn icon={<Underline size={14} />} onClick={() => handleCommand('underline')} tooltip="Подчеркнутый" />
                    <div className="w-px h-4 bg-stone-600 mx-1" />
                    <ToolbarBtn icon={<List size={14} />} onClick={() => handleCommand('insertUnorderedList')} tooltip="Список" />
                    <ToolbarBtn icon={<LinkIcon size={14} />} onClick={() => {
                        const url = prompt('Введите ссылку:');
                        if (url) handleCommand('createLink', url);
                    }} tooltip="Ссылка" />
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};

const ToolbarBtn = ({ icon, onClick, tooltip }: { icon: React.ReactNode, onClick: () => void, tooltip?: string }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        onMouseDown={e => e.preventDefault()}
        className="p-1.5 rounded hover:bg-stone-700 text-stone-400 hover:text-indigo-300 transition-colors active:scale-95"
    >
        {icon}
    </button>
);
