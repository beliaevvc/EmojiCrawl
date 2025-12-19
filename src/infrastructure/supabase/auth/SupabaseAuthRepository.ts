/**
 * SupabaseAuthRepository — infrastructure адаптер для auth.
 *
 * ### Что это
 * Реализация порта `AuthRepository` через Supabase (`supabase.auth.*`).
 *
 * ### Зачем это нужно
 * В Блоке 5 (Infrastructure adapters) мы изолируем I/O:
 * - UI и Zustand store’ы **не импортируют** `supabase` и не знают о его API
 * - всё взаимодействие с Supabase Auth сосредоточено здесь
 *
 * ### Как используется
 * Обычно репозиторий создаётся один раз и передаётся в `createAuthUseCases(...)`,
 * после чего store вызывает use-cases.
 *
 * ### Важные детали/инварианты
 * - `onAuthStateChange` возвращает `dispose()`. Вызывать его обязан владелец подписки
 *   (у нас это `useAuthStore`), иначе будут утечки/дубликаты.
 * - Мы возвращаем упрощённый `AuthUser` (id/email), чтобы не тянуть типы Supabase
 *   в application слой.
 */

import { supabase } from '@/lib/supabase';
import type { AuthRepository, AuthUser, AuthError } from '@/features/auth/application';

function toAuthUser(user: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

function toAuthError(error: { message: string } | null | undefined): AuthError | null {
  if (!error) return null;
  return { message: error.message };
}

export class SupabaseAuthRepository implements AuthRepository {
  async getSessionUser(): Promise<AuthUser | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return toAuthUser(session?.user);
  }

  onAuthStateChange(onUserChange: (user: AuthUser | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      onUserChange(toAuthUser(session?.user));
    });

    return () => subscription.unsubscribe();
  }

  async signInAnonymously(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInAnonymously();
    return { user: toAuthUser(data.user), error: toAuthError(error) };
  }

  async signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    return { user: toAuthUser(data.user), error: toAuthError(error) };
  }

  async signUp(params: {
    email: string;
    password: string;
  }): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });
    return { user: toAuthUser(data.user), error: toAuthError(error) };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: toAuthError(error) };
  }
}


