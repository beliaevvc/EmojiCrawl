import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

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
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  subscribeToNotes: () => void;
  unsubscribeFromNotes: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ notes: data as Note[] });
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createNote: async (title: string, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return; // Only auth users can create

    try {
      const newNote = {
        title,
        content,
        user_id: user.id,
        author_email: user.email,
        // position is not in DB yet, so we don't send it
      };

      const { error } = await supabase.from('notes').insert([newNote]);
      if (error) throw error;
      
      // We don't need to manually update state if we use subscription, 
      // but for instant feedback let's re-fetch or optimistic update?
      // Subscription is better.
      await get().fetchNotes(); 

    } catch (err: any) {
      console.error('Error creating note:', err);
      set({ error: err.message });
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    // We only send title/content updates to DB
    // Position updates are local only for now (unless we add columns to DB)
    
    // Check if user owns this note? RLS handles it, but UI should also check.
    const user = useAuthStore.getState().user;
    const note = get().notes.find(n => n.id === id);
    
    if (!user || !note || note.user_id !== user.id) {
       // Allow local updates for everyone? No, read-only for others.
       // But wait, user wants "everyone sees notes".
       // If I edit someone else's note, what happens? 
       // RLS says UPDATE only for owner. So it will fail in DB.
       return; 
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
            title: updates.title, 
            content: updates.content 
        })
        .eq('id', id);

      if (error) throw error;
      await get().fetchNotes();
    } catch (err: any) {
      console.error('Error updating note:', err);
    }
  },

  deleteNote: async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      await get().fetchNotes();
    } catch (err: any) {
      console.error('Error deleting note:', err);
    }
  },

  subscribeToNotes: () => {
    supabase
      .channel('public:notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        // Simple reload on any change
        get().fetchNotes();
      })
      .subscribe();

    // Store subscription to unsubscribe later?
    // zustand store is global, maybe we just keep it running.
  },

  unsubscribeFromNotes: () => {
    supabase.removeAllChannels();
  }
}));

