/**
 * Auth Application Layer (public API).
 *
 * ### Что это
 * Единая публичная точка входа для application слоя auth-фичи.
 *
 * ### Зачем
 * UI/stores должны импортировать **только отсюда** (или напрямую из application файлов),
 * не зная о конкретной инфраструктуре (Supabase).
 *
 * ### Что экспортируем
 * - `AuthRepository` / типы (`AuthUser`, `AuthError`) — порт для инфраструктуры
 * - `createAuthUseCases(...)` — use-cases для UI/stores
 */

export * from './authUseCases';
export * from './ports/AuthRepository';


