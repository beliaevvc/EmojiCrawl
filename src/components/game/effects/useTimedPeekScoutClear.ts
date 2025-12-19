/**
 * useTimedPeekScoutClear — авто-очистка peek/scout оверлеев по таймеру.
 *
 * Контекст (Блок 3, effects): вынесено из `GameScreen` как UI-таймеры.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - автоматически очищает временные оверлеи:
 * - peekCards (epiphany) через 5 секунд,
 * - scoutCards через 3 секунды.
 *
 * Инварианты:
 * - это UI-таймеры, не меняют механику,
 * - диспатчит только служебные экшены `CLEAR_PEEK/CLEAR_SCOUT` (как раньше).
 */

import { useEffect } from 'react';
import type { GameAction, GameState } from '@/types/game';

export function useTimedPeekScoutClear({
  peekCards,
  scoutCards,
  dispatch,
}: {
  peekCards: GameState['peekCards'];
  scoutCards: GameState['scoutCards'];
  dispatch: React.Dispatch<GameAction>;
}) {
  useEffect(() => {
    if (peekCards) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_PEEK' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [peekCards, dispatch]);

  useEffect(() => {
    if (scoutCards) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_SCOUT' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scoutCards, dispatch]);
}


