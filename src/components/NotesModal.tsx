import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Bold, Italic, Underline, Link as LinkIcon, List, RotateCcw, ArrowDownRight, ArrowDownLeft, Cloud, CloudOff, Loader2, LayoutGrid, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotesStore, Note } from '../stores/useNotesStore';
import { ConfirmationModal } from './ConfirmationModal';

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

interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const NotesModal = ({ onClose }: { onClose: () => void }) => {
  // Global State
  const { user } = useAuthStore();
  const { notes: remoteNotes, loading: loadingRemote, error: notesError, fetchNotes, createNote, updateNote, deleteNote, subscribeToNotes, unsubscribeFromNotes } = useNotesStore();

  // Local State
  const [localNotes, setLocalNotes] = useState<Note[]>(() => {
    try {
        const saved = localStorage.getItem('skazmor_notes');
        let parsed: Note[] = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(parsed)) parsed = [];

        // Ensure Balance note exists locally
        const hasBalanceNote = parsed.some(n => n.id === 'balance_perks');
        if (!hasBalanceNote) {
             const filtered = parsed.filter(n => n.id !== 'balance_info' && !n.title.includes('Баланс'));
             const balanceNote = { id: 'balance_perks', title: 'Баланс Перков (ограничения)', content: DEFAULT_CONTENT, user_id: 'local' };
             return [balanceNote, ...filtered];
        }
        
        // Update balance note content
        const balanceIndex = parsed.findIndex(n => n.id === 'balance_perks');
        if (balanceIndex !== -1) {
             parsed[balanceIndex].content = DEFAULT_CONTENT;
             parsed[balanceIndex].title = 'Баланс Перков (ограничения)';
             const balanceNote = parsed.splice(balanceIndex, 1)[0];
             return [balanceNote, ...parsed];
        }

        if (parsed.length === 0) {
             return [{ id: 'balance_perks', title: 'Баланс Перков (ограничения)', content: DEFAULT_CONTENT, user_id: 'local' }];
        }
        return parsed;
    } catch (e) {
        return [{ id: 'balance_perks', title: 'Баланс Перков (ограничения)', content: DEFAULT_CONTENT, user_id: 'local' }];
    }
  });

  // Effective Notes (Local or Remote based on auth)
  const notes = user ? remoteNotes : localNotes;
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null); // For custom modal
  const [viewMode, setViewMode] = useState<'editor' | 'list'>('editor'); // New view mode state

  // Sync with remote when user changes
  useEffect(() => {
    if (user) {
        fetchNotes();
        subscribeToNotes();
        // If we switch to remote and have no active note, wait for fetch
    } else {
        unsubscribeFromNotes();
        // Fallback to local
    }
    return () => unsubscribeFromNotes();
  }, [user]);

  // Set active note when notes load
  useEffect(() => {
    if (notes.length > 0) {
        if (!activeNoteId || !notes.find(n => n.id === activeNoteId)) {
            setActiveNoteId(notes[0].id);
        }
    } else if (!loadingRemote && user) {
        // If we loaded and have NO notes in DB, create one locally in UI or auto-create in DB?
        // Let's create one immediately to avoid empty state issues.
        // Actually, better to just show "Create Note" UI if empty, but for now
        // let's auto-trigger createNote if the list is truly empty after load.
        // BUT we need to be careful not to loop.
        // Safer: just handle activeNote being null in render.
        setActiveNoteId(null);
    }
  }, [notes, activeNoteId, loadingRemote, user]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];
  
  // Local state for title to prevent cursor jumps and lag
  const [localTitle, setLocalTitle] = useState('');
  
  // Sync local title when switching notes (only when ID changes)
  useEffect(() => {
    if (activeNote) {
        // Only update if ID changed OR if it's the first load (localTitle empty)
        // We avoid updating if ID is same to prevent overwriting user typing
        setLocalTitle(activeNote.title || '');
    }
  }, [activeNoteId]); // REMOVED activeNote dependency to stop overwriting!

  // We need to update localTitle if it was empty on first load though.
  // Or if remote updated from someone else.
  // But for now, priority is not losing input.
  
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Window State
  const [windowState, setWindowState] = useState<WindowState>(() => {
      try {
          const saved = localStorage.getItem('skazmor_notes_window');
          if (saved) {
              return JSON.parse(saved);
          }
      } catch (e) {
          // ignore
      }
      return {
          x: typeof window !== 'undefined' ? window.innerWidth - 450 : 100,
          y: 96,
          width: 400,
          height: 500
      };
  });

  // Interaction State
  const interactionRef = useRef<{
    type: 'move' | 'resize-se' | 'resize-sw' | 'resize-e' | 'resize-w' | 'resize-s' | null;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  }>({
    type: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0
  });

  // Save Local Notes
  useEffect(() => {
    if (!user) {
        localStorage.setItem('skazmor_notes', JSON.stringify(localNotes));
    }
  }, [localNotes, user]);

  useEffect(() => {
      localStorage.setItem('skazmor_notes_window', JSON.stringify(windowState));
  }, [windowState]);

  // Debounce updates for remote to avoid spamming DB
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateContent = () => {
    if (editorRef.current && activeNote) {
      const content = editorRef.current.innerHTML;
      
      if (user) {
          // Remote Update (Debounced)
          // Optimistic update locally in store? Store handles fetching. 
          // We can't easily optimistic update without complex store logic.
          // For now, let's just trigger updateNote with debounce.
          
          if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = setTimeout(() => {
              updateNote(activeNote.id, { content });
          }, 1000); // 1 sec delay
      } else {
          // Local Update (Instant)
          setLocalNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content } : n));
      }
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

  // Interaction Handlers (same as before)
  const startInteraction = (e: React.PointerEvent, type: 'move' | 'resize-se' | 'resize-sw' | 'resize-e' | 'resize-w' | 'resize-s') => {
    e.preventDefault();
    e.stopPropagation();
    window.getSelection()?.removeAllRanges();
    interactionRef.current = {
        type,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: windowState.x,
        startTop: windowState.y,
        startWidth: windowState.width,
        startHeight: windowState.height
    };
    window.addEventListener('pointermove', handleInteraction);
    window.addEventListener('pointerup', stopInteraction);
  };

  const handleInteraction = (e: PointerEvent) => {
    const { type, startX, startY, startLeft, startTop, startWidth, startHeight } = interactionRef.current;
    if (!type) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (type === 'move') {
        setWindowState(prev => ({ ...prev, x: startLeft + deltaX, y: startTop + deltaY }));
    } else if (type === 'resize-se') {
        setWindowState(prev => ({ ...prev, width: Math.max(300, startWidth + deltaX), height: Math.max(300, startHeight + deltaY) }));
    } else if (type === 'resize-sw') {
        const newWidth = Math.max(300, startWidth - deltaX);
        const effectiveDeltaX = startWidth - newWidth; 
        setWindowState(prev => ({ ...prev, width: newWidth, height: Math.max(300, startHeight + deltaY), x: startLeft + effectiveDeltaX }));
    } else if (type === 'resize-e') {
        setWindowState(prev => ({ ...prev, width: Math.max(300, startWidth + deltaX) }));
    } else if (type === 'resize-w') {
        const newWidth = Math.max(300, startWidth - deltaX);
        const effectiveDeltaX = startWidth - newWidth;
        setWindowState(prev => ({ ...prev, width: newWidth, x: startLeft + effectiveDeltaX }));
    } else if (type === 'resize-s') {
        setWindowState(prev => ({ ...prev, height: Math.max(300, startHeight + deltaY) }));
    }
  };

  const stopInteraction = () => {
    interactionRef.current.type = null;
    window.removeEventListener('pointermove', handleInteraction);
    window.removeEventListener('pointerup', stopInteraction);
  };

  const handleAddNote = async () => {
    if (user) {
        const newId = await createNote('Новая заметка', '');
        if (newId) setActiveNoteId(newId);
    } else {
        const newNote = {
            id: Date.now().toString(),
            title: 'Новая заметка',
            content: '',
            user_id: 'local'
        };
        setLocalNotes(prev => [...prev, newNote]);
        setActiveNoteId(newNote.id);
    }
  };

  const handleRemoveNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (notes.length === 1 && !user) return; 
    
    if (user) {
        setNoteToDelete(id);
    } else {
        const newNotes = localNotes.filter(n => n.id !== id);
        setLocalNotes(newNotes);
        if (activeNoteId === id) setActiveNoteId(newNotes[0]?.id || null);
    }
  };

  const confirmDelete = async () => {
      if (noteToDelete) {
          await deleteNote(noteToDelete);
          setNoteToDelete(null);
      }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setLocalTitle(newTitle); // Immediate UI update

      if (user && activeNote) {
          if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = setTimeout(() => {
              updateNote(activeNote.id, { title: newTitle });
          }, 800); // 800ms debounce
      } else {
          setLocalNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: newTitle } : n));
      }
  }

  // Ref to track previous ID to detect switch
  const prevNoteIdRef = useRef<string | null>(null);

  // Sync editor content when active note changes OR view mode changes to editor
  useEffect(() => {
    if (editorRef.current && activeNote && viewMode === 'editor') {
        const isNoteSwitch = prevNoteIdRef.current !== activeNoteId;
        
        // Always update content if we just switched notes OR just opened the editor view
        if (isNoteSwitch || viewMode === 'editor') {
            editorRef.current.innerHTML = activeNote.content || '';
            prevNoteIdRef.current = activeNoteId;
        } 
        
        // Handle realtime updates while in editor
        if (!isNoteSwitch && editorRef.current.innerHTML !== activeNote.content) {
             if (document.activeElement !== editorRef.current) {
                 editorRef.current.innerHTML = activeNote.content || '';
             }
        }
    }
  }, [activeNoteId, activeNote?.content, viewMode]); // Added viewMode dependency 

  // Don't render until client-side hydration (window check) 
  // If loading, show loader. If no notes and loaded, show empty state.
  if (loadingRemote && !activeNote) {
      return (
        <div
            className="fixed z-40 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95 items-center justify-center text-stone-400 gap-2"
            style={{ 
                width: windowState.width, 
                height: windowState.height,
                left: windowState.x,
                top: windowState.y
            }}
        >
            <Loader2 className="animate-spin" />
            <span className="text-xs">Загрузка...</span>
        </div>
      );
  }
  
  // Render minimal UI if no notes exist yet
  const isEmptyState = !activeNote && !loadingRemote;

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
    <>
        <div
            className="fixed z-40 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95"
            style={{ 
                width: windowState.width, 
                height: windowState.height,
                left: windowState.x,
                top: windowState.y
            }}
        >
        {/* Header / Tabs */}
        <div 
            className="flex items-center bg-stone-950/80 p-1 border-b border-stone-800 cursor-move select-none"
            onPointerDown={(e) => startInteraction(e, 'move')}
        >
            <div className="flex-1 flex overflow-x-auto scrollbar-hide gap-1 pr-2">
                {/* List View Toggle Button - Always First */}
                <button
                    onClick={() => setViewMode(prev => prev === 'editor' ? 'list' : 'editor')}
                    onPointerDown={e => e.stopPropagation()}
                    className={`px-2 py-1.5 rounded-lg transition-colors mr-2 ${viewMode === 'list' ? 'bg-indigo-900/50 text-indigo-300' : 'text-stone-500 hover:text-stone-300'}`}
                    title={viewMode === 'editor' ? "Список заметок" : "Вернуться к редактору"}
                >
                    {viewMode === 'editor' ? <LayoutGrid size={16} /> : <ChevronLeft size={16} />}
                </button>

                {isEmptyState && viewMode === 'editor' ? (
                    <span className="px-3 py-1.5 text-xs text-stone-500 italic">Нет заметок</span>
                ) : (
                    viewMode === 'editor' && notes.map(note => (
                        <div 
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            onPointerDown={e => e.stopPropagation()}
                            className={`
                                px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer flex items-center gap-2 min-w-[80px] max-w-[140px] transition-colors group relative
                                ${activeNoteId === note.id ? 'bg-stone-800 text-indigo-300' : 'bg-transparent text-stone-500 hover:bg-stone-800/50 hover:text-stone-300'}
                            `}
                            title={note.author_email ? `Автор: ${note.author_email}` : 'Локальная заметка'}
                        >
                            <span className="truncate flex-1">{note.title || 'Без названия'}</span>
                            {/* Show author avatar/dot if shared? */}
                            
                            {(notes.length > 1 || user) && (
                                <button onClick={(e) => handleRemoveNote(e, note.id)} className="hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    ))
                )}
                
                {viewMode === 'list' && <span className="text-xs font-bold text-stone-400 py-1.5 px-2">Все заметки ({notes.length})</span>}

                {!loadingRemote && viewMode === 'editor' && (
                    <button 
                        onClick={handleAddNote} 
                        onPointerDown={e => e.stopPropagation()}
                        className="px-2 text-stone-600 hover:text-indigo-400 transition-colors"
                        title="Создать заметку"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
            
            <button 
                onClick={() => {
                    setWindowState({ 
                        width: 400, 
                        height: 500,
                        x: window.innerWidth - 450,
                        y: 96
                    });
                }} 
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

        {/* Empty State Body */}
        {isEmptyState && viewMode === 'editor' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-500 gap-4">
                <p>Список заметок пуст</p>
                <button 
                    onClick={handleAddNote}
                    className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Создать первую заметку
                </button>
            </div>
        ) : viewMode === 'list' ? (
            /* List View Body */
            <div className="flex-1 p-4 overflow-y-auto bg-stone-900/50">
               <div className="grid grid-cols-1 gap-3">
                   {notes.map(note => (
                       <div 
                            key={note.id}
                            onClick={() => {
                                setActiveNoteId(note.id);
                                setViewMode('editor');
                            }}
                            className={`
                                p-4 rounded-xl border transition-all cursor-pointer group
                                ${activeNoteId === note.id 
                                    ? 'bg-stone-800/80 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                                    : 'bg-stone-800/30 border-stone-800 hover:bg-stone-800/60 hover:border-stone-700'}
                            `}
                       >
                           <div className="flex justify-between items-start mb-2">
                               <h3 className={`font-bold text-sm truncate pr-4 ${activeNoteId === note.id ? 'text-indigo-300' : 'text-stone-300'}`}>
                                   {note.title || 'Без названия'}
                               </h3>
                               {note.author_email && (
                                   <span className="text-[10px] bg-stone-900/50 text-stone-500 px-1.5 py-0.5 rounded border border-stone-800">
                                       {note.author_email.split('@')[0]}
                                   </span>
                               )}
                           </div>
                           <p className="text-xs text-stone-500 line-clamp-2 h-8 leading-relaxed">
                               {note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 100) : <span className="italic opacity-50">Нет текста...</span>}
                           </p>
                           <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-800/50">
                               <span className="text-[10px] text-stone-600">
                                   {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Локально'}
                               </span>
                               {(user && user.id === note.user_id) || (!user && note.user_id === 'local') ? (
                                   <button 
                                        onClick={(e) => handleRemoveNote(e, note.id)}
                                        className="p-1.5 text-stone-600 hover:text-rose-500 hover:bg-rose-900/20 rounded transition-colors"
                                        title="Удалить"
                                   >
                                       <X size={12} />
                                   </button>
                               ) : null}
                           </div>
                       </div>
                   ))}
               </div>
               {/* Add Note Button in List View */}
               <button 
                    onClick={() => {
                        handleAddNote();
                        setViewMode('editor');
                    }}
                    className="w-full mt-4 py-3 rounded-xl border border-dashed border-stone-700 text-stone-500 hover:bg-stone-800/30 hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
               >
                   <Plus size={16} />
                   Создать новую заметку
               </button>
            </div>
        ) : (
            <>
        {/* Title Input */}
        <div className="p-3 border-b border-stone-800 bg-stone-900/50 flex items-center gap-2">
            <input 
                value={localTitle}
                onChange={handleTitleChange}
                disabled={loadingRemote}
                className="flex-1 bg-transparent text-stone-200 font-bold text-lg outline-none placeholder-stone-600 disabled:opacity-50"
                placeholder="Заголовок..."
            />
            {activeNote?.author_email && (
                        <span className="text-[9px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded border border-stone-700" title={activeNote.author_email}>
                            by {activeNote.author_email.split('@')[0] || 'Unknown'}
                        </span>
                    )}
                </div>

                {/* Editor */}
                <div 
                    ref={editorRef}
                    contentEditable={!loadingRemote}
                    onInput={updateContent}
                    onBlur={updateContent}
                    onPaste={handlePaste}
                    className="flex-1 p-4 outline-none text-stone-300 text-sm overflow-y-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&>a]:text-indigo-400 [&>a]:underline selection:bg-indigo-500/30 selection:text-indigo-200 disabled:opacity-50"
                    style={{ whiteSpace: 'pre-wrap' }}
                />
            </>
        )}
        
        {/* Footer */}
        <div className="p-1 bg-stone-950/50 border-t border-stone-800 text-[10px] text-stone-600 flex justify-between items-end px-3 relative">
            <div 
                onPointerDown={(e) => startInteraction(e, 'resize-sw')}
                className="cursor-nesw-resize text-stone-600 hover:text-stone-300 transition-colors p-1 absolute bottom-0 left-0 z-20"
            >
                <ArrowDownLeft size={16} />
            </div>

            <div className="ml-4 flex items-center gap-2">
                {user ? (
                    <span className="text-emerald-500/70 flex items-center gap-1">
                        <Cloud size={10} />
                        Cloud Sync
                    </span>
                ) : (
                    <span className="text-stone-600 flex items-center gap-1">
                        <CloudOff size={10} />
                        Local
                    </span>
                )}
            </div>
            
            <div className="flex flex-col items-end gap-0.5 mr-4">
                {notesError ? (
                    <span className="text-rose-500 font-bold animate-pulse">{notesError}</span>
                ) : (
                    <span>{user ? 'Все изменения сохранены' : 'Локальное сохранение'}</span>
                )}
                {user && <span className="text-[9px] text-stone-700">Видно всем игрокам</span>}
            </div>
            
            <div 
                onPointerDown={(e) => startInteraction(e, 'resize-se')}
                className="cursor-nwse-resize text-stone-600 hover:text-stone-300 transition-colors p-1 absolute bottom-0 right-0 z-20"
            >
                <ArrowDownRight size={16} />
            </div>
        </div>

        {/* Resize Handles */}
        <div className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-10 hover:bg-white/5" onPointerDown={(e) => startInteraction(e, 'resize-e')} />
        <div className="absolute top-0 left-0 w-2 h-full cursor-ew-resize z-10 hover:bg-white/5" onPointerDown={(e) => startInteraction(e, 'resize-w')} />
        <div className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize z-10 hover:bg-white/5" onPointerDown={(e) => startInteraction(e, 'resize-s')} />

        </div>

        {/* Toolbar */}
        <AnimatePresence>
            {toolbarPosition && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                    className="fixed z-[60] flex items-center gap-1 p-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl"
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

        <AnimatePresence>
            {noteToDelete && (
                <ConfirmationModal 
                    title="Удалить заметку?"
                    message="Это действие необратимо. Заметка будет удалена для всех пользователей."
                    onConfirm={confirmDelete}
                    onCancel={() => setNoteToDelete(null)}
                />
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
