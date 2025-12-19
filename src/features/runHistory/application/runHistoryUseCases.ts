/**
 * RunHistory use-cases (application слой).
 *
 * ### Что это
 * Единое место, где мы определяем “правило приложения” сохранения истории забегов.
 *
 * Тут живёт “склейка” формата сохранения забега:
 * - защита от дублей по `startTime`,
 * - вычисление `gameNumber`,
 * - проставление `id/date/result/overheads`.
 *
 * Сами операции I/O остаются в `RunHistoryRepository` (infrastructure).
 *
 * ### Почему это важно
 * Это не доменная механика боя, но это важное прикладное правило:
 * “когда и как мы фиксируем завершённый забег”.
 * Держать это в use-case удобнее, чем размазывать по UI/утилитам.
 */

import type { GameStats, Overheads, RunHistoryEntry } from '@/types/game';
import type { RunHistoryRepository } from './ports/RunHistoryRepository';

function makeId(): string {
  // Совместимо со старой реализацией из `statsStorage.ts` (короткий random id).
  return Math.random().toString(36).substr(2, 9);
}

export function createRunHistoryUseCases(repository: RunHistoryRepository) {
  return {
    getRunHistory: (): RunHistoryEntry[] => repository.getAll(),

    clearHistory: (): void => repository.clear(),

    /**
     * Старый API из `storage.ts`: просто добавить готовую запись в начало.
     * Оставляем для совместимости (если где-то используется).
     */
    saveEntry: (entry: RunHistoryEntry): void => {
      const history = repository.getAll();
      repository.setAll([entry, ...history]);
    },

    /**
     * Основной путь сохранения (используется `useRunCompletionEffects`).
     * Поведение 1:1 с прежним `statsStorage.saveRun`.
     */
    saveRun: (stats: GameStats, result: 'won' | 'lost', overheads: Overheads): void => {
      const history = repository.getAll();
      const existing = history.find((h) => h.startTime === stats.startTime);
      if (existing) return;

      const gameNumber = history.length + 1;
      const newEntry: RunHistoryEntry = {
        ...stats,
        id: makeId(),
        gameNumber,
        date: new Date().toISOString(),
        result,
        overheads,
      };

      repository.setAll([newEntry, ...history]);
    },
  };
}


