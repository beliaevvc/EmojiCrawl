/**
 * Auth use-cases (application слой).
 *
 * ### Что это
 * Набор “команд” уровня приложения (use-cases) для auth.
 * Сейчас они являются **тонкой прослойкой** над портом `AuthRepository` и просто делегируют вызовы.
 *
 * ### Зачем это нужно, если можно дергать репозиторий напрямую
 * Это сознательная архитектурная точка:
 * - UI/stores зависят от **application API**, а не от Supabase SDK/его типов.
 * - Позже мы сможем добавить правила и оркестрацию **не меняя UI**:
 *   - миграция guest → user,
 *   - аналитика/логирование auth-событий,
 *   - политика повторных попыток/ошибок,
 *   - единое поведение “после входа” (например, синхронизация кошелька/шаблонов).
 *
 * ### Как используется сейчас
 * `useAuthStore` создаёт `authUseCases` один раз и вызывает:
 * - `getSessionUser()` при старте,
 * - `onAuthStateChange()` для подписки (и хранит dispose),
 * - `signIn* / signUp / signOut()` для действий из UI (например, `AuthModal`).
 */

import type { AuthRepository } from './ports/AuthRepository';

export function createAuthUseCases(repository: AuthRepository) {
  return {
    getSessionUser: () => repository.getSessionUser(),
    onAuthStateChange: (onUserChange: (user: Awaited<ReturnType<AuthRepository['getSessionUser']>>) => void) =>
      repository.onAuthStateChange(onUserChange),
    signInAnonymously: () => repository.signInAnonymously(),
    signInWithPassword: (params: Parameters<AuthRepository['signInWithPassword']>[0]) => repository.signInWithPassword(params),
    signUp: (params: Parameters<AuthRepository['signUp']>[0]) => repository.signUp(params),
    signOut: () => repository.signOut(),
  };
}


