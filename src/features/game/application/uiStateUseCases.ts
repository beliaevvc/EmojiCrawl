/**
 * UIState use-cases (application слой).
 *
 * ### Что это
 * Набор use-cases для UIState: загрузка/сохранение позиций и видимости HUD окон.
 *
 * ### Зачем use-cases
 * Даже если сейчас логика простая, мы фиксируем единый application API, чтобы:
 * - UI/хуки не зависели от конкретного хранилища (LocalStorage),
 * - позже можно было добавить нормализацию/валидацию/миграции формата,
 * - централизовать поведение (например, дефолты, merge-патчи).
 *
 * Сейчас это тонкая прослойка над `UIStateRepository`.
 */

import type { HUDVisibility, UIState, UIStateRepository, WindowPosition } from './ports/UIStateRepository';

export function createUIStateUseCases(repository: UIStateRepository) {
  return {
    loadState: (): UIState => repository.loadState(),
    loadPositions: (): Record<string, WindowPosition> => repository.loadState().positions,
    loadVisibility: (): HUDVisibility => repository.loadState().visibility,
    savePositions: (positionsPatch: Record<string, WindowPosition>) => repository.savePositions(positionsPatch),
    saveVisibility: (visibilityPatch: Partial<HUDVisibility>) => repository.saveVisibility(visibilityPatch),
  };
}


