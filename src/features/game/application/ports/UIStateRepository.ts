/**
 * UIStateRepository — порт application слоя для хранения UI-состояния HUD.
 *
 * ### Что это
 * Контракт (interface) для сохранения/загрузки UI-состояния HUD.
 *
 * ### Зачем (Блок 5)
 * Раньше UI напрямую читал/писал `localStorage` через `utils/uiStorage.ts`.
 * В Блоке 5 мы выносим I/O во внешний слой (`infrastructure`), а UI/хуки работают
 * через порт/use-case.
 *
 * ### Важно
 * Это НЕ “игровая механика” и не влияет на баланс/правила.
 * Это чисто UI-память: расположение и видимость окон HUD.
 *
 * ### Кто реализует
 * Сейчас реализация — `LocalStorageUIStateRepository`.
 * Позже можно заменить на другой storage без изменений UI-слоя.
 */

export interface WindowPosition {
  x: number;
  y: number;
}

export interface HUDVisibility {
  deckStats: boolean;
  deckViewer: boolean;
  discardViewer: boolean;
  discardStats: boolean;
  statsWindow: boolean;
  logWindow: boolean;
  labelsWindow: boolean;
}

export interface UIState {
  positions: Record<string, WindowPosition>;
  visibility: HUDVisibility;
}

export interface UIStateRepository {
  loadState(): UIState;
  savePositions(positionsPatch: Record<string, WindowPosition>): void;
  saveVisibility(visibilityPatch: Partial<HUDVisibility>): void;
}


