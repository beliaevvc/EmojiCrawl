import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
  signInAnonymously: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  
  signInWithEmail: async (email: string) => {
    // Placeholder to use variable to suppress linter error until implementation
    console.log('SignIn with email requested:', email);
    return { error: null }; 
  },

  signInAnonymously: async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (data.user) set({ user: data.user });
    return { error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) set({ user: null });
    return { error };
  },

  initializeAuth: async () => {
    set({ loading: true });
    
    // Check active session
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, loading: false });

    // Listen for changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null });
    });
  }
}));

