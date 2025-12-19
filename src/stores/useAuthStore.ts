/**
 * useAuthStore — Zustand store для auth-состояния UI.
 *
 * ### Что хранит
 * - `user`: упрощённый `AuthUser` (id/email) или `null`
 * - `loading`: флаг инициализации
 *
 * ### Почему так устроено (Блок 5)
 * Раньше store мог напрямую дергать `supabase.auth.*`.
 * В Блоке 5 мы переносим инфраструктуру (I/O) в `src/infrastructure/*` и оставляем store тонким:
 * - store вызывает application use-cases,
 * - use-cases работают через порт,
 * - порт реализован Supabase-адаптером.
 *
 * ### Важный инвариант: подписка onAuthStateChange
 * У подписки должен быть **один владелец**. Иначе легко получить:
 * - утечки (обработчики не отписались),
 * - дубли событий (каждый новый обработчик будет обновлять store повторно).
 *
 * Поэтому store хранит `disposeAuthSubscription` на уровне модуля и перед каждым новым subscribe
 * сначала делает dispose старой подписки.
 *
 * ### Кто использует этот store
 * - `MainMenu` вызывает `initializeAuth()` на старте приложения
 * - `AuthModal` вызывает `signInWithPassword/signUp`
 * - UI может читать `user` для отображения профиля/доступа к cloud-фичам
 */
import { create } from 'zustand';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/auth/SupabaseAuthRepository';
import { createAuthUseCases, type AuthUser } from '@/features/auth/application';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  signInAnonymously: () => Promise<{ error: { message: string } | null }>;
  signInWithPassword: (params: { email: string; password: string }) => Promise<{ error: { message: string } | null }>;
  signUp: (params: { email: string; password: string }) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
  initializeAuth: () => Promise<void>;
}

/**
 * Блок 5 (Infrastructure adapters):
 * - store остаётся “тонким”
 * - Supabase I/O вынесен в `infrastructure/*`
 * - подпиской onAuthStateChange владеет ОДНО место (этот store)
 */
const authUseCases = createAuthUseCases(new SupabaseAuthRepository());

let disposeAuthSubscription: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  
  signInAnonymously: async () => {
    const { user, error } = await authUseCases.signInAnonymously();
    if (user) set({ user });
    return { error };
  },

  signInWithPassword: async ({ email, password }) => {
    const { user, error } = await authUseCases.signInWithPassword({ email, password });
    if (user) set({ user });
    return { error };
  },

  signUp: async ({ email, password }) => {
    const { user, error } = await authUseCases.signUp({ email, password });
    if (user) set({ user });
    return { error };
  },

  signOut: async () => {
    const { error } = await authUseCases.signOut();
    if (!error) set({ user: null });
    return { error };
  },

  initializeAuth: async () => {
    set({ loading: true });
    
    // Check active session
    const user = await authUseCases.getSessionUser();
    set({ user, loading: false });

    // Listen for changes (важно: избегаем утечек/дубликатов подписок)
    if (disposeAuthSubscription) disposeAuthSubscription();
    disposeAuthSubscription = authUseCases.onAuthStateChange((nextUser) => {
      set({ user: nextUser });
    });
  }
}));

