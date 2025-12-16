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
    // We are using Magic Link (passwordless) or SignUp with random password if confirm is disabled
    // Since user disabled email confirm, we can just signUp with a dummy password 
    // OR use magic link. The user wanted "enter email and password".
    // Let's implement standard signInWithPassword but since we don't have registration form separate,
    // we might need to try signUp first, if fail (exists) -> signIn.
    // But the user said "without email confirmation".
    
    // Simplest approach for "Enter email + password":
    // Try to Sign Up. If error "User already registered", then Sign In.
    return { error: null }; // Placeholder, will be implemented in component or here
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

