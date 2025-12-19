/**
 * Notes use-cases (application слой).
 *
 * ### Что это
 * Набор use-cases для работы с заметками (получить список, создать, обновить, удалить, подписаться).
 *
 * ### Зачем use-cases, если есть репозиторий
 * Это точка расширения “логики приложения”:
 * - UI/stores зависят от стабильного application API,
 * - инфраструктура (Supabase) остаётся заменяемой,
 * - позже можно добавить правила без переписывания UI:
 *   - валидация/санитайзинг HTML,
 *   - ограничения по количеству заметок,
 *   - оптимизация/дедуп fetch на realtime‑событиях,
 *   - кеширование.
 *
 * Сейчас (в рамках Блока 5) это тонкая прослойка над портом `NotesRepository`.
 */

import type { NotesRepository } from './ports/NotesRepository';

export function createNotesUseCases(repository: NotesRepository) {
  return {
    fetchAll: () => repository.fetchAll(),
    create: (params: Parameters<NotesRepository['create']>[0]) => repository.create(params),
    update: (params: Parameters<NotesRepository['update']>[0]) => repository.update(params),
    delete: (params: Parameters<NotesRepository['delete']>[0]) => repository.delete(params),
    subscribeToChanges: (onAnyChange: () => void) => repository.subscribeToChanges(onAnyChange),
  };
}


