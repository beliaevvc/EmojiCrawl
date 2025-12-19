/**
 * NotesRepository — порт (interface) application слоя для “заметок”.
 *
 * ### Зачем этот файл
 * В Блоке 5 (Infrastructure adapters) мы убираем прямые вызовы Supabase из UI и Zustand store’ов.
 * Вместо этого:
 * - UI/stores зависят от application use-cases,
 * - use-cases работают через порт (этот интерфейс),
 * - инфраструктура (Supabase) реализует порт в `src/infrastructure/*`.
 *
 * ### Что описывает порт
 * Минимальный контракт CRUD + realtime‑подписка на изменения таблицы `notes`.
 *
 * ### Важный инвариант (подписка)
 * `subscribeToChanges` возвращает `dispose()`:
 * - его обязан вызвать владелец подписки (у нас это `useNotesStore`),
 * - иначе будут утечки/дубликаты обработчиков.
 *
 * Отдельно: мы НЕ используем `supabase.removeAllChannels()` — это опасно, потому что
 * может снести чужие realtime‑подписки (не только notes).
 */

export type NoteRecord = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  author_email?: string;
  created_at?: string;
  /**
   * Сейчас position — локальное поле (не хранится в БД).
   * Оставляем его в типе, чтобы UI мог держать это состояние рядом с заметкой.
   */
  position?: { x: number; y: number };
};

export type NotesError = { message: string };

export interface NotesRepository {
  fetchAll(): Promise<{ notes: NoteRecord[]; error: NotesError | null }>;
  create(params: {
    title: string;
    content: string;
    user_id: string;
    author_email: string;
  }): Promise<{ note: NoteRecord | null; error: NotesError | null }>;
  update(params: { id: string; title?: string; content?: string }): Promise<{ error: NotesError | null }>;
  delete(params: { id: string }): Promise<{ error: NotesError | null }>;

  /**
   * Подписка на изменения таблицы notes (realtime).
   * Возвращает dispose, который должен быть вызван, чтобы избежать утечек/дубликатов.
   */
  subscribeToChanges(onAnyChange: () => void): () => void;
}


