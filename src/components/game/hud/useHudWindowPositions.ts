/**
 * useHudWindowPositions — позиции плавающих HUD-окон (persisted).
 *
 * Контекст (Блок 3): раньше позиции окон управлялись прямо в `GameScreen`.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - хранит координаты/размеры окон (если пользователь двигает),
 * - сохраняет/загружает их через `uiStorage` (localStorage),
 * - позволяет сбросить layout на дефолт.
 *
 * Инварианты:
 * - поведение 1:1 со старым вариантом,
 * - не влияет на механику игры.
 */

import { useCallback, useState } from 'react';
import { loadUIPositions, saveUIPositions } from '@/utils/uiStorage';
import type { WindowPosition } from '@/utils/uiStorage';

export function useHudWindowPositions() {
  const [windowPositions, setWindowPositions] = useState<Record<string, WindowPosition>>(() => loadUIPositions());

  const updateWindowPosition = useCallback(
    (key: string, pos: WindowPosition) => {
      const newPositions = { ...windowPositions, [key]: pos };
      setWindowPositions(newPositions);
      saveUIPositions(newPositions);
    },
    [windowPositions]
  );

  const resetLayout = useCallback(() => {
    setWindowPositions({});
    saveUIPositions({});
  }, []);

  return { windowPositions, updateWindowPosition, resetLayout };
}


