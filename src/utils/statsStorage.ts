/**
 * statsStorage — временный bridge для обратной совместимости.
 *
 * ### Что это
 * Исторические функции для истории забегов:
 * - `saveRun(stats, result, overheads)`
 * - `getRunHistory()`
 * - `clearHistory()`
 *
 * ### Почему это bridge (Блок 5)
 * Раньше этот файл напрямую писал/читал `localStorage`.
 * В Блоке 5 мы вынесли I/O в `infrastructure/localStorage/runHistory/*`,
 * а логику форматирования записи забега — в application use-case.
 *
 * Здесь остаётся совместимый API, но прямого `localStorage` больше нет.
 *
 * ### Что именно считает use-case
 * - не сохраняет дубликаты (dedupe по `startTime`)
 * - считает `gameNumber`
 * - проставляет `id/date/result/overheads`
 */

import type { RunHistoryEntry, GameStats, Overheads } from '@/types/game';
import { createRunHistoryUseCases } from '@/features/runHistory/application';
import { LocalStorageRunHistoryRepository } from '@/infrastructure/localStorage/runHistory/LocalStorageRunHistoryRepository';

const runHistoryUseCases = createRunHistoryUseCases(new LocalStorageRunHistoryRepository());

export const saveRun = (stats: GameStats, result: 'won' | 'lost', overheads: Overheads) => {
  runHistoryUseCases.saveRun(stats, result, overheads);
};

export const getRunHistory = (): RunHistoryEntry[] => {
  return runHistoryUseCases.getRunHistory();
};

export const clearHistory = () => {
  runHistoryUseCases.clearHistory();
};

