/**
 * Game Domain Kernel.
 *
 * Этот модуль содержит ЧИСТУЮ игровую логику и правила (Enterprise Business Logic).
 *
 * ПРАВИЛА:
 * 1. Никаких зависимостей от React, UI-компонентов, хуков.
 * 2. Никаких зависимостей от инфраструктуры (Supabase, LocalStorage, fetch).
 * 3. Никаких зависимостей от стейт-менеджеров (Zustand, Redux) - только чистые функции и типы.
 *
 * Структура:
 * - model/: Типы сущностей (Card, Player, GameState) и value objects.
 * - reducer/: Чистые функции изменения состояния (gameReducer, action handlers).
 * - deck/: Логика работы с колодой (создание, перемешивание) - временно здесь.
 *
 * @module GameDomain
 */

export * from './model';
export * from './reducer';
export * from './deck';
