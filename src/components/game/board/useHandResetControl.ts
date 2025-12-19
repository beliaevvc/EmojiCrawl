/**
 * useHandResetControl — правило и обработчик “Сброс (-5 HP)”.
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы правило не жило в экране.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - вычисляет `canReset` по старому правилу (1:1):
 *   `isGodMode || (hp > 5 && cardsOnTable === 4)`
 * - отдаёт `onReset`, который вызывает переданный `resetHand()`.
 *
 * Инварианты:
 * - не меняет механику, только перенос правила,
 * - финальное изменение state происходит через `resetHand()` (обычно команда gameSession).
 */
import { useCallback, useMemo } from 'react';
import type { Card } from '@/types/game';

export type UseHandResetControlParams = {
  enemySlots: Array<Card | null>;
  hp: number;
  isGodMode: boolean;
  resetHand: () => void;
};

export function useHandResetControl(params: UseHandResetControlParams) {
  const { enemySlots, hp, isGodMode, resetHand } = params;

  const cardsOnTable = useMemo(() => enemySlots.filter((c) => c !== null).length, [enemySlots]);
  const canReset = isGodMode || (hp > 5 && cardsOnTable === 4);

  const onReset = useCallback(() => {
    resetHand();
  }, [resetHand]);

  return { canReset, onReset };
}


