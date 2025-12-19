/**
 * useFloatingTextController — контроллер “плавающих текстов” (floating texts).
 *
 * Контекст (Блок 3.3): вынесено из `GameScreen`, чтобы управление оверлеем было отдельной подсистемой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - хранит массив `floatingTexts`,
 * - даёт `addFloatingText()` и `removeFloatingText()` для эффектов/валидаторов.
 *
 * Инварианты:
 * - поведение полностью совместимо с `FloatingTextOverlay`,
 * - это только UI-состояние; не влияет на механику игры.
 */

import { useCallback, useState } from 'react';
import type { FloatingTextItem } from '@/components/FloatingText';

export function useFloatingTextController() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);

  const addFloatingText = useCallback(
    (x: number, y: number, text: string, color: string, centered = false, scale?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      setFloatingTexts((prev) => [...prev, { id, x, y, text, color, centered, scale }]);
    },
    []
  );

  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { floatingTexts, addFloatingText, removeFloatingText };
}


