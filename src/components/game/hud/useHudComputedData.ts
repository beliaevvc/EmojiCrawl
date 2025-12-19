/**
 * useHudComputedData — вычисляемые данные для HUD/окон.
 *
 * Контекст (Блок 3): вынесено из `GameScreen` как чистые вычисления (без side effects).
 *
 * Слой: UI (React). Это hook-утилита на `useMemo`.
 *
 * Что делает:
 * - строит “cleanDeck”: колоду без карт, которые уже находятся на столе/в руках,
 * - считает статистику колоды/сброса по типам карт,
 * - вычисляет активные баффы (по `activeEffects`),
 * - вычисляет активные лейблы монстров (по картам в колоде/сбросе/поле/руках).
 *
 * Входы:
 * - массивы карт (`deck/discard/enemySlots`) и текущие карты в руках/рюкзаке,
 * - `activeEffects` и `buffSpellIds`.
 *
 * Инварианты:
 * - не меняет state игры, только вычисляет,
 * - рассчитано на переиспользование в разных экранах.
 *
 */

import { useMemo } from 'react';
import type { Card, MonsterLabelType } from '@/types/game';

const ZERO_STATS = {
  monster: 0,
  coin: 0,
  potion: 0,
  shield: 0,
  weapon: 0,
  spell: 0,
  skull: 0,
} as const;

export function useHudComputedData({
  deck,
  discardPile,
  enemySlots,
  leftHandCard,
  rightHandCard,
  backpackCard,
  activeEffects,
  buffSpellIds,
}: {
  deck: Card[];
  discardPile: Card[];
  enemySlots: Array<Card | null>;
  leftHandCard: Card | null;
  rightHandCard: Card | null;
  backpackCard: Card | null;
  activeEffects: string[];
  buffSpellIds: string[];
}) {
  const cardsInPlayIds = useMemo(() => {
    return new Set(
      [
        ...enemySlots.filter(Boolean).map((c) => (c as Card).id),
        leftHandCard?.id,
        rightHandCard?.id,
        backpackCard?.id,
      ].filter(Boolean) as string[]
    );
  }, [enemySlots, leftHandCard?.id, rightHandCard?.id, backpackCard?.id]);

  const cleanDeck = useMemo(() => deck.filter((c) => !cardsInPlayIds.has(c.id)), [deck, cardsInPlayIds]);

  const deckStats = useMemo(() => {
    return cleanDeck.reduce(
      (acc, card) => {
        acc[card.type] = (acc[card.type] || 0) + 1;
        return acc;
      },
      { ...ZERO_STATS } as Record<string, number>
    );
  }, [cleanDeck]);

  const discardStats = useMemo(() => {
    return discardPile.reduce(
      (acc, card) => {
        acc[card.type] = (acc[card.type] || 0) + 1;
        return acc;
      },
      { ...ZERO_STATS } as Record<string, number>
    );
  }, [discardPile]);

  const activeBuffs = useMemo(() => activeEffects.filter((e) => buffSpellIds.includes(e)), [activeEffects, buffSpellIds]);

  const activeLabels = useMemo(() => {
    const allCards = [
      ...deck,
      ...discardPile,
      ...enemySlots.filter(Boolean),
      leftHandCard,
      rightHandCard,
      backpackCard,
    ].filter((c): c is Card => !!c && c.type === 'monster');

    return Array.from(
      new Set(allCards.map((c) => c.label).filter((l): l is MonsterLabelType => l !== undefined))
    );
  }, [deck, discardPile, enemySlots, leftHandCard, rightHandCard, backpackCard]);

  return { deckStats, discardStats, activeBuffs, activeLabels };
}


