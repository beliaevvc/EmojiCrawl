/**
 * LocalStorageUIStateRepository — infrastructure адаптер для UIState (HUD layout/visibility).
 *
 * ### Что это
 * Реальная реализация порта `UIStateRepository` через `window.localStorage`.
 *
 * ### Зачем это нужно (Блок 5)
 * Мы хотим, чтобы UI/хуки не знали, *где именно* хранится UI-state.
 * Поэтому:
 * - интерфейс хранения живёт во внутреннем слое (`UIStateRepository`),
 * - конкретная реализация (LocalStorage) живёт во внешнем (`infrastructure`).
 *
 * Это упрощает замену хранения (например, на IndexedDB или Supabase) и тестирование.
 *
 * ### Что хранится
 * Один ключ `skazmor_ui_state`:
 * - `positions`: map windowId → {x,y}
 * - `visibility`: флаги видимости HUD окон
 *
 * ### Инварианты/безопасность
 * - Должно быть безопасно при отсутствии `window`/`localStorage` (например, SSR) → `safeGetLocalStorage`.
 * - Парсинг JSON может падать → всё обёрнуто в try/catch и имеет дефолты.
 * - Мы делаем patch‑сохранение: `savePositions/saveVisibility` мерджат данные, не затирая остальное.
 */

import type { HUDVisibility, UIState, UIStateRepository, WindowPosition } from '@/features/game/application/ports/UIStateRepository';

const STORAGE_KEY = 'skazmor_ui_state';

const DEFAULT_VISIBILITY: HUDVisibility = {
  deckStats: true,
  deckViewer: true,
  discardViewer: true,
  discardStats: true,
  statsWindow: true,
  logWindow: true,
  labelsWindow: true,
};

function safeGetLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeState(parsed: any): UIState {
  return {
    positions: (parsed?.positions ?? {}) as Record<string, WindowPosition>,
    visibility: { ...DEFAULT_VISIBILITY, ...(parsed?.visibility ?? {}) },
  };
}

export class LocalStorageUIStateRepository implements UIStateRepository {
  loadState(): UIState {
    const storage = safeGetLocalStorage();
    if (!storage) return { positions: {}, visibility: DEFAULT_VISIBILITY };

    try {
      const stored = storage.getItem(STORAGE_KEY);
      if (!stored) return { positions: {}, visibility: DEFAULT_VISIBILITY };
      return normalizeState(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load UI state', e);
      return { positions: {}, visibility: DEFAULT_VISIBILITY };
    }
  }

  savePositions(positionsPatch: Record<string, WindowPosition>): void {
    const storage = safeGetLocalStorage();
    if (!storage) return;

    try {
      const current = this.loadState();
      const newState: UIState = {
        ...current,
        positions: { ...current.positions, ...positionsPatch },
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save UI positions', e);
    }
  }

  saveVisibility(visibilityPatch: Partial<HUDVisibility>): void {
    const storage = safeGetLocalStorage();
    if (!storage) return;

    try {
      const current = this.loadState();
      const newState: UIState = {
        ...current,
        visibility: { ...current.visibility, ...visibilityPatch },
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save UI visibility', e);
    }
  }
}


