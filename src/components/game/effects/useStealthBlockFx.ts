/**
 * useStealthBlockFx — UI-правило “скрыт/stealth” + визуальный фидбек.
 *
 * Контекст (Блок 3, effects): вынесено из `GameScreen`, чтобы проверки не жили в экране.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - даёт `checkStealthBlock(monsterId)` для запрета взаимодействия,
 * - даёт `isStealthBlocked(cardId)` для UI-подсветок/блокировок,
 * - при попытке взаимодействия может показать floating text “👻 СКРЫТ”.
 *
 * Инварианты:
 * - правило завязано на `enemySlots` и refs слотов (поведение 1:1),
 * - это UI-уровень: доменные последствия происходят только через reducer/commands.
 */

import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { Card } from '@/types/game';

export function useStealthBlockFx({
  enemySlots,
  slotRefs,
  addFloatingText,
}: {
  enemySlots: Array<Card | null>;
  slotRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  addFloatingText: (x: number, y: number, text: string, color: string, centered?: boolean, scale?: number) => void;
}) {
  const checkStealthBlock = useCallback(
    (monsterId: string): boolean => {
      const monsterIdx = enemySlots.findIndex((c) => c?.id === monsterId);
      if (monsterIdx === -1) return false;
      const monster = enemySlots[monsterIdx];
      if (!monster || monster.type !== 'monster' || monster.ability !== 'stealth') return false;

      /**
       * Правило “СКРЫТ”:
       * stealth-монстра нельзя атаковать/таргетить, пока на поле есть хотя бы один ДРУГОЙ
       * монстр без stealth. Это чисто UI-блокировка (доменные эффекты — через reducer).
       */
      const otherMonsters = enemySlots.filter(
        (c) => c?.type === 'monster' && c.id !== monsterId && c.ability !== 'stealth'
      );
      if (otherMonsters.length > 0) {
        const slotEl = slotRefs.current[monsterIdx];
        if (slotEl) {
          const rect = slotEl.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top;
          // Визуальный фидбек: показываем игроку причину, почему действие “не сработало”.
          addFloatingText(
            x,
            y,
            '👻 СКРЫТ',
            'text-stone-400 font-bold text-lg md:text-xl drop-shadow-md z-[100] tracking-wider animate-bounce',
            true
          );
        }
        return true;
      }
      return false;
    },
    [enemySlots, slotRefs, addFloatingText]
  );

  const isStealthBlocked = useCallback(
    (card: Card) => {
      if (card.type !== 'monster' || card.ability !== 'stealth') return false;
      const otherMonsters = enemySlots.filter(
        (c) => c?.type === 'monster' && c.id !== card.id && c.ability !== 'stealth'
      );
      return otherMonsters.length > 0;
    },
    [enemySlots]
  );

  return { checkStealthBlock, isStealthBlocked };
}


