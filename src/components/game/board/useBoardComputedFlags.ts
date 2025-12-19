/**
 * useBoardComputedFlags — “флаги поля” и UI-модификаторы карт.
 *
 * Контекст (Блок 3): вынесено из `GameScreen` как вычисляемые данные для UI.
 *
 * Слой: UI (React). Чистые вычисления (useMemo/useCallback).
 *
 * Что делает:
 * - вычисляет блокировки поля по активным монстрам (`scream/web/rot`),
 * - возвращает `getCardModifier` (отображаемое “было/стало” на токенах) с учётом проклятий/эффектов.
 *
 * Инварианты:
 * - не меняет state игры и не исполняет side effects,
 * - используется только для отображения/разрешения UI действий.
 */

import { useCallback, useMemo } from 'react';
import type { Card, CurseType } from '@/types/game';

export function useBoardComputedFlags({
  enemySlots,
  curse,
}: {
  enemySlots: Array<Card | null>;
  curse: CurseType | null;
}) {
  const isSellBlocked = useMemo(
    () => enemySlots.some((card) => card && card.type === 'monster' && card.ability === 'scream'),
    [enemySlots]
  );

  const hasRot = useMemo(
    () => enemySlots.some((card) => card && card.type === 'monster' && card.ability === 'rot'),
    [enemySlots]
  );

  const hasWeb = useMemo(
    () => enemySlots.some((card) => card && card.type === 'monster' && card.ability === 'web'),
    [enemySlots]
  );

  const getCardModifier = useCallback(
    (card: Card | null): number => {
      if (!card) return 0;
      if (card.type === 'potion') {
        const rotMod = hasRot ? -2 : 0;
        const poisonMod = curse === 'poison' ? -1 : 0;
        return rotMod + poisonMod;
      }
      if (card.type === 'weapon') {
        return curse === 'tempering' ? 1 : 0;
      }
      if (card.type === 'coin') {
        return curse === 'greed' ? 2 : 0;
      }
      return 0;
    },
    [hasRot, curse]
  );

  return { isSellBlocked, hasRot, hasWeb, getCardModifier };
}


