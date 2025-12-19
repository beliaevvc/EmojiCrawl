/**
 * AuthRepository — порт (interface) application слоя для аутентификации.
 *
 * ### Зачем этот файл
 * В Блоке 5 (Infrastructure adapters) мы **убираем прямые вызовы Supabase** из UI и Zustand store’ов.
 * Вместо этого UI/stores зависят от application API, а реальные I/O (Supabase) живут в `src/infrastructure/*`.
 *
 * ### Что именно описывает порт
 * Это **минимальный контракт**, который сейчас нужен приложению:
 * - получить текущего пользователя из активной сессии,
 * - подписаться на изменения auth-состояния (SIGNED_IN / SIGNED_OUT / refresh),
 * - выполнить базовые действия входа/регистрации/выхода.
 *
 * ### Почему тут не Supabase User/Session
 * Мы намеренно **не протаскиваем** типы Supabase внутрь application слоя.
 * Внутренним слоям достаточно `AuthUser` с полями `id/email`, потому что:
 * - в UI email используется как “ник” (меню),
 * - `id` используется для привязки заметок/кошелька.
 *
 * Это снижает связанность: позже можно заменить провайдера auth (или формат) без массового рефакторинга.
 *
 * ### Важный инвариант
 * `onAuthStateChange` возвращает `dispose()` — **владелец подписки обязан** вызвать его при повторной инициализации
 * или при уничтожении “владельца”, чтобы избежать утечек и дубликатов обработчиков.
 *
 */

export type AuthUser = {
  id: string;
  email?: string | null;
};

export type AuthError = {
  message: string;
};

export interface AuthRepository {
  getSessionUser(): Promise<AuthUser | null>;

  /**
   * Подписка на изменения auth-состояния.
   * Возвращает функцию отписки (dispose) — её обязан вызвать владелец подписки.
   */
  onAuthStateChange(onUserChange: (user: AuthUser | null) => void): () => void;

  signInAnonymously(): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signUp(params: { email: string; password: string }): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut(): Promise<{ error: AuthError | null }>;
}


