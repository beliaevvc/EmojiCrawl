/**
 * useHudVisibility — управление видимостью HUD-окон (persisted).
 *
 * Контекст (Блок 3): ранее это было локальным стейтом в `GameScreen`.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - хранит `HUDVisibility` (какие окна/разделы включены),
 * - сохраняет изменения в localStorage через `uiStorage`.
 *
 * Инварианты:
 * - поведение 1:1 со старым вариантом,
 * - это чисто UI-настройка, не влияет на механику игры.
 */

import { useCallback, useState } from 'react';
import { loadUIVisibility, saveUIVisibility } from '@/utils/uiStorage';
import type { HUDVisibility } from '@/utils/uiStorage';

export function useHudVisibility() {
  const [hudVisibility, setHudVisibilityState] = useState<HUDVisibility>(() => loadUIVisibility());

  const setHudVisibility = useCallback((next: HUDVisibility) => {
    setHudVisibilityState(next);
    saveUIVisibility(next);
  }, []);

  const updateHudVisibility = useCallback((patch: Partial<HUDVisibility>) => {
    setHudVisibilityState((prev) => {
      const next = { ...prev, ...patch };
      saveUIVisibility(patch);
      return next;
    });
  }, []);

  return { hudVisibility, setHudVisibility, updateHudVisibility };
}


