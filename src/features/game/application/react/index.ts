/**
 * React adapters for Game Application Layer.
 *
 * Слой: Application / React adapters (публичный вход).
 *
 * ## Что это
 * Публичная точка входа для React‑обвязок application слоя фичи `game`.
 *
 * ## Зачем
 * Application слой сам по себе не должен зависеть от React.
 * Но UI нужен удобный способ “подключить” application/use-cases и владение состоянием сессии.
 *
 * Поэтому React‑специфичная часть вынесена сюда:
 * - `GameSessionProvider` (владелец `GameState` в пределах game‑ветки),
 * - `useGameSession` (доступ к state/dispatch/commands).
 *
 * ## Инварианты / правила
 * - Всё, что импортирует React, лежит в этой папке (или ниже), чтобы граница была прозрачной.
 * - Domain слой не должен зависеть от этих модулей.
 */

export * from './GameSessionProvider';


