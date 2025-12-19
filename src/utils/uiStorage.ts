/**
 * uiStorage — временный bridge для обратной совместимости.
 *
 * ### Что это
 * Набор функций `load* / save*` для UI-состояния HUD (позиции и видимость окон).
 *
 * ### Почему это bridge (Блок 5)
 * Исторически UI-хуки (`useHudWindowPositions`, `useHudVisibility`) импортировали функции из `utils/uiStorage.ts`
 * и этот файл напрямую работал с `localStorage`.
 *
 * В Блоке 5 (Infrastructure adapters) мы переносим **весь I/O** в `src/infrastructure/localStorage/*`,
 * чтобы “внешние системы” (LocalStorage) не были размазаны по UI.
 *
 * Чтобы сделать миграцию безопасной и маленькой:
 * - этот файл оставлен как **совместимый API** (те же функции/типы),
 * - но он больше НЕ трогает `localStorage` напрямую,
 * - он делегирует в application use-cases (`createUIStateUseCases`) и infra‑репозиторий.
 *
 * ### Как использовать
 * Старый код может продолжать вызывать:
 * - `loadUIPositions/loadUIVisibility`
 * - `saveUIPositions/saveUIVisibility`
 *
 * Новому коду предпочтительнее зависеть от портов/use-cases напрямую:
 * `UIStateRepository` + `createUIStateUseCases(...)`.
 *
 * ### Инварианты/ограничения
 * - Функции должны быть безопасны для окружений без `window` (SSR/тесты) → infra‑репозиторий сам делает guards.
 */

import type { HUDVisibility, UIState, WindowPosition } from '@/features/game/application/ports/UIStateRepository';
import { createUIStateUseCases } from '@/features/game/application/uiStateUseCases';
import { LocalStorageUIStateRepository } from '@/infrastructure/localStorage/ui/LocalStorageUIStateRepository';

export type { HUDVisibility, UIState, WindowPosition };

const uiStateUseCases = createUIStateUseCases(new LocalStorageUIStateRepository());

export const saveUIPositions = (positions: Record<string, WindowPosition>) => {
  uiStateUseCases.savePositions(positions);
};

export const saveUIVisibility = (visibility: Partial<HUDVisibility>) => {
  uiStateUseCases.saveVisibility(visibility);
};

export const loadUIState = (): UIState => {
  return uiStateUseCases.loadState();
};

export const loadUIPositions = (): Record<string, WindowPosition> => {
  return uiStateUseCases.loadPositions();
};

export const loadUIVisibility = (): HUDVisibility => {
  return uiStateUseCases.loadVisibility();
};
