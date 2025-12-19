/**
 * useCardSelection
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы правило “какую карту можно открыть”
 * не жило в экране и не размазывалось по обработчикам кликов.
 *
 * Слой: UI (React).
 *
 * Инкапсулирует правило: какие карты можно “открыть” (zoom/описание).
 * Сейчас: спеллы и монстры с ability.
 *
 * Важно: 1:1 логика с прежним `handleCardClick` в `GameScreen`.
 *
 * Вход:
 * - `onSelect(card)` — внешний setter выбранной карты (для модалки зума/описания).
 *
 * Выход:
 * - `handleCardClick(card)` — готовый обработчик клика для `GameBoard/Slot`.
 *
 * Инварианты:
 * - чисто UI-правило: не меняет `GameState`,
 * - доменные действия (атаки/применения) сюда не относятся.
 */

import { useCallback } from 'react';
import type { Card } from '@/types/game';

export function useCardSelection({ onSelect }: { onSelect: (card: Card) => void }) {
  const handleCardClick = useCallback(
    (card: Card) => {
      if (card.type === 'spell' || (card.type === 'monster' && card.ability)) {
        onSelect(card);
      }
    },
    [onSelect]
  );

  return { handleCardClick };
}


