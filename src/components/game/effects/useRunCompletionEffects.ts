/**
 * useRunCompletionEffects — эффекты завершения забега (saveRun + награда).
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы завершение забега было отдельным эффектом.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - при `status === won/lost` сохраняет забег в историю (`saveRun`),
 * - при победе начисляет кристаллы в кошелёк (через `addCrystals`).
 *
 * Инварианты:
 * - логика 1:1 со старым `GameScreen`,
 * - это побочный эффект UI-слоя (persist/экономика), доменную механику не меняет.
 */

import { useEffect } from 'react';
import { saveRun } from '@/utils/statsStorage';
import type { GameState, GameStats, Overheads } from '@/types/game';

export function useRunCompletionEffects({
  status,
  stats,
  overheads,
  coins,
  addCrystals,
}: {
  status: GameState['status'];
  stats: GameStats;
  overheads: Overheads;
  coins: number;
  addCrystals: (amount: number) => void;
}) {
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      saveRun(stats, status, overheads);

      // Награда: начисляем кристаллы в кошелёк только при победе.
      if (status === 'won' && coins > 0) {
        addCrystals(coins);
      }
    }
    // ВНИМАНИЕ: намеренно повторяем старые зависимости (без coins/addCrystals),
    // чтобы не менять поведение рефакторингом.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stats, overheads]);
}


