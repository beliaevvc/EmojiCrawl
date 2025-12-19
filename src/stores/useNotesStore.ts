/**
 * useNotesStore — Zustand store для заметок.
 *
 * ### Что хранит
 * - `notes`: массив заметок (из Supabase, если пользователь залогинен)
 * - `loading/error`: состояние загрузки/ошибок
 *
 * ### Почему так устроено (Блок 5)
 * В Блоке 5 мы выносим Supabase I/O в инфраструктуру:
 * - этот store **не делает** `supabase.from('notes')...` и не управляет realtime-каналами напрямую,
 * - вместо этого он вызывает application use-cases (`createNotesUseCases`),
 * - а Supabase-адаптер реализует порт `NotesRepository`.
 *
 * ### Realtime подписка: важный инвариант
 * Подписка может включаться/выключаться при смене `user` (см. `NotesModal`).
 * Поэтому:
 * - store хранит `disposeNotesSubscription` на уровне модуля,
 * - перед каждой новой подпиской делает dispose старой,
 * - и никогда не вызывает `removeAllChannels()` (это сломало бы другие realtime‑подсистемы).
 */
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { SupabaseNotesRepository } from '@/infrastructure/supabase/notes/SupabaseNotesRepository';
import { createNotesUseCases } from '@/features/notes/application';

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  author_email?: string;
  created_at?: string;
  position?: { x: number; y: number }; // Local only for now
}

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<string | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  subscribeToNotes: () => void;
  unsubscribeFromNotes: () => void;
}

/**
 * Блок 5 (Infrastructure adapters):
 * - Supabase I/O вынесен в `infrastructure/supabase/notes/*`
 * - store остаётся “тонким”: стейт + вызовы use-cases + локальная оптимистичность
 */
const notesUseCases = createNotesUseCases(new SupabaseNotesRepository());

let disposeNotesSubscription: (() => void) | null = null;

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const { notes, error } = await notesUseCases.fetchAll();
      if (error) throw error;
      set({ notes: notes as Note[] });
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createNote: async (title: string, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return null; // Only auth users can create

    try {
      const { note, error } = await notesUseCases.create({
        title,
        content,
        user_id: user.id,
        author_email: user.email || 'Anonymous',
      });

      if (error) throw error;

      await get().fetchNotes();
      return note?.id ?? null;

    } catch (err: any) {
      console.error('Error creating note:', err);
      set({ error: err.message });
      return null;
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    // We only send title/content updates to DB
    // Position updates are local only for now (unless we add columns to DB)
    
    // Check if user owns this note? RLS handles it, but UI should also check.
    const user = useAuthStore.getState().user;
    const note = get().notes.find(n => n.id === id);
    
    if (!user || !note || note.user_id !== user.id) {
       console.warn('Permission denied: User does not own this note.');
       set({ error: 'Вы не можете редактировать чужую заметку' });
       return; 
    }

    set({ error: null }); // Clear previous errors
    
    // Optimistic Update: Update local state immediately
    set(state => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
    }));

    try {
      const { error } = await notesUseCases.update({
        id,
        title: updates.title,
        content: updates.content,
      });

      if (error) throw error;
      // Note: Subscription will trigger fetchNotes, but we can also do it manually to be safe/fast
      // await get().fetchNotes(); 
    } catch (err: any) {
      console.error('Error updating note:', err);
      set({ error: 'Ошибка сохранения: ' + err.message });
    }
  },

  deleteNote: async (id: string) => {
    try {
      const { error } = await notesUseCases.delete({ id });
      if (error) throw error;
      await get().fetchNotes();
    } catch (err: any) {
      console.error('Error deleting note:', err);
    }
  },

  subscribeToNotes: () => {
    // Защита от дубликатов: store может быть вызван несколько раз при переключениях user/local.
    if (disposeNotesSubscription) disposeNotesSubscription();
    disposeNotesSubscription = notesUseCases.subscribeToChanges(() => {
      get().fetchNotes();
    });
  },

  unsubscribeFromNotes: () => {
    if (!disposeNotesSubscription) return;
    disposeNotesSubscription();
    disposeNotesSubscription = null;
  }
}));

