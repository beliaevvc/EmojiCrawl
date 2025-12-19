/**
 * RunHistory Application Layer (public API).
 *
 * ### Что это
 * Публичная точка входа application слоя для runHistory-фичи.
 *
 * ### Зачем
 * UI должен импортировать use-cases и порт отсюда, не зная о LocalStorage.
 * Реализация `RunHistoryRepository` находится в `infrastructure/localStorage/runHistory/*`.
 */

export * from './runHistoryUseCases';
export * from './ports/RunHistoryRepository';


