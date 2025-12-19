/**
 * useLastEffectFloatingTexts — floating texts для “последних эффектов” (lastEffect).
 *
 * Контекст (Блок 3, effects): вынесено из `GameScreen`, чтобы точечные эффекты не жили в экране.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - реагирует на `lastEffect` и спавнит floating texts для отдельных эффектов:
 * - corrosion: “☣️ -2” над слотом цели (рука/рюкзак),
 * - corpseeater: “🧟 +X HP” над слотом врага с задержкой.
 *
 * Инварианты:
 * - поведение 1:1 со старым `GameScreen`,
 * - чисто визуальный эффект; state игры не меняет.
 */

import { useEffect } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type { Card } from '@/types/game';

type EffectLike =
  | { type: 'corrosion'; targetId: string; value?: number }
  | { type: 'corpseeater'; targetId: string; value: number }
  | { type: string; targetId?: string; value?: number };

export function useLastEffectFloatingTexts({
  lastEffect,
  enemySlots,
  leftHandCardId,
  rightHandCardId,
  backpackCardId,
  leftHandRef,
  rightHandRef,
  backpackRef,
  slotRefs,
  addFloatingText,
}: {
  lastEffect: EffectLike | EffectLike[] | null | undefined;
  enemySlots: Array<Card | null>;
  leftHandCardId?: string;
  rightHandCardId?: string;
  backpackCardId?: string;
  leftHandRef: RefObject<HTMLDivElement>;
  rightHandRef: RefObject<HTMLDivElement>;
  backpackRef: RefObject<HTMLDivElement>;
  slotRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  addFloatingText: (x: number, y: number, text: string, color: string, centered?: boolean, scale?: number) => void;
}) {
  useEffect(() => {
    if (!lastEffect) return;

    const effects = Array.isArray(lastEffect) ? lastEffect : [lastEffect];

    effects.forEach((effect) => {
      const { type, targetId, value } = effect as any;

      if (!targetId) return;

      if (type === 'corrosion') {
        /**
         * “corrosion” нацеливается на конкретную карту (в руке/рюкзаке).
         * Нам нужно выбрать DOM-ref соответствующего слота, чтобы правильно поставить floating text.
         */
        let ref: RefObject<HTMLDivElement> | null = null;
        if (leftHandCardId === targetId) ref = leftHandRef;
        else if (rightHandCardId === targetId) ref = rightHandRef;
        else if (backpackCardId === targetId) ref = backpackRef;

        if (ref?.current) {
          const rect = ref.current.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          addFloatingText(
            x,
            y,
            '☣️ -2',
            'text-lime-400 font-bold text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-[100]',
            true
          );
        }
      } else if (type === 'corpseeater') {
        const slotIdx = enemySlots.findIndex((c) => c?.id === targetId);
        if (slotIdx !== -1) {
          setTimeout(() => {
            const slotEl = slotRefs.current[slotIdx];
            if (slotEl) {
              const rect = slotEl.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top;
              addFloatingText(
                x,
                y,
                `🧟 +${value} HP`,
                'text-emerald-400 font-bold text-sm drop-shadow-black z-[100]',
                true
              );
            }
          }, 600);
        }
      }
    });
  }, [
    lastEffect,
    enemySlots,
    leftHandCardId,
    rightHandCardId,
    backpackCardId,
    leftHandRef,
    rightHandRef,
    backpackRef,
    slotRefs,
    addFloatingText,
  ]);
}


