/**
 * useSequentialHp — последовательная визуализация изменения HP.
 *
 * Контекст (Блок 3.3): вынесено из `GameScreen`, чтобы анимация HP была отдельной подсистемой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - берёт очередь `hpUpdates` и обновляет `visualHp` пошагово с задержкой,
 * - позволяет показывать HP на HUD “плавно”, даже если state обновился рывком.
 *
 * Инварианты:
 * - чисто визуальный хук: доменный state не меняет,
 * - `visualHp` всегда стремится к актуальному `hp`.
 */

import { useEffect, useRef, useState } from 'react';

export function useSequentialHp({
  hp,
  hpUpdates,
  stepDelayMs = 800,
}: {
  hp: number;
  hpUpdates: Array<{ timestamp: number; to: number }>;
  stepDelayMs?: number;
}) {
  const [visualHp, setVisualHp] = useState(hp);
  const lastProcessedHpRef = useRef<number>(0);
  const isAnimatingHp = useRef(false);

  useEffect(() => {
    const newUpdates = hpUpdates.filter((u) => u.timestamp > lastProcessedHpRef.current);

    if (newUpdates.length > 0 && !isAnimatingHp.current) {
      isAnimatingHp.current = true;

      const processQueue = async () => {
        for (const update of newUpdates) {
          setVisualHp(update.to);
          lastProcessedHpRef.current = update.timestamp;
          await new Promise((r) => setTimeout(r, stepDelayMs));
        }
        isAnimatingHp.current = false;
      };

      processQueue();
    } else if (newUpdates.length === 0 && !isAnimatingHp.current && visualHp !== hp) {
      setVisualHp(hp);
    }
  }, [hpUpdates, hp, stepDelayMs, visualHp]);

  return { visualHp };
}


