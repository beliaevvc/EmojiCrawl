/**
 * RunHistoryRepository — порт application слоя для истории забегов.
 *
 * ### Зачем (Блок 5)
 * Раньше история забегов была “утилитой”, которая сама работала с `localStorage`.
 * В рамках Блока 5 мы делаем I/O заменяемым:
 * - порт определяет контракт хранения,
 * - infra реализует его (LocalStorage),
 * - application use-case содержит логику сохранения забега.
 *
 * Здесь мы намеренно опираемся на существующий тип `RunHistoryEntry`,
 * чтобы не ломать UI (StatsScreen) и текущий формат сохранений.
 */

import type { RunHistoryEntry } from '@/types/game';

export interface RunHistoryRepository {
  getAll(): RunHistoryEntry[];
  setAll(history: RunHistoryEntry[]): void;
  clear(): void;
}


