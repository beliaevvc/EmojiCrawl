/**
 * Notes Application Layer (public API).
 *
 * ### Что это
 * Публичная точка входа для application слоя фичи notes.
 *
 * ### Зачем
 * UI/stores импортируют отсюда use-cases и порты, не зная о Supabase.
 * Инфраструктура реализует порт и подключается при композиции (сейчас это делает store).
 */

export * from './notesUseCases';
export * from './ports/NotesRepository';


