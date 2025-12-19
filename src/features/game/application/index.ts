/**
 * Game Application Layer (public API).
 *
 * Слой: Application (публичный вход).
 *
 * ## Что это
 * Единая публичная точка входа для application слоя фичи `game`.
 *
 * ## Зачем
 * - Упростить импорты для UI: вместо множества путей импортируем из одного места.
 * - Явно зафиксировать “что считается публичным API” application слоя.
 *
 * ## Что экспортирует
 * - `gameSession` (фасад “команд” уровня приложения → маппинг в доменные `GameAction`)
 * - React‑адаптеры application слоя (Provider/hooks), необходимые UI:
 *   см. `./react` → `GameSessionProvider`, `useGameSession`.
 *
 * ## Инварианты / правила
 * - `gameSession` может зависеть от domain и content контейнера, но не должен тянуть React.
 * - React‑адаптеры находятся отдельно в `./react`, чтобы было понятно, где начинается зависимость от React.
 * - Domain слой не должен импортировать ничего из `features/game/application`.
 */

export * from './gameSession';
export * from './react';


