/**
 * LocalStorageRunHistoryRepository — infrastructure адаптер для истории забегов.
 *
 * ### Что это
 * Реализация порта `RunHistoryRepository` через `window.localStorage`.
 *
 * ### Зачем (Блок 5)
 * История забегов используется в:
 * - `StatsScreen` (просмотр/очистка)
 * - `useRunCompletionEffects` (автосохранение результата)
 *
 * Раньше UI писал в localStorage напрямую через `utils/statsStorage.ts`.
 * В Блоке 5 выносим I/O в infrastructure, чтобы UI зависел от application API.
 *
 * ### Формат хранения
 * Ключ `skazmor_run_history`, значение — JSON массив `RunHistoryEntry[]`.
 *
 * ### Безопасность
 * - При отсутствии `window/localStorage` возвращаем пустую историю (SSR/тесты).
 * - Ошибки парсинга JSON не должны ломать UI → try/catch.
 */

import type { RunHistoryEntry } from '@/types/game';
import type { RunHistoryRepository } from '@/features/runHistory/application';

const STORAGE_KEY = 'skazmor_run_history';

function safeGetLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export class LocalStorageRunHistoryRepository implements RunHistoryRepository {
  getAll(): RunHistoryEntry[] {
    const storage = safeGetLocalStorage();
    if (!storage) return [];

    try {
      const stored = storage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? (parsed as RunHistoryEntry[]) : [];
    } catch (e) {
      console.error('Failed to load history', e);
      return [];
    }
  }

  setAll(history: RunHistoryEntry[]): void {
    const storage = safeGetLocalStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  clear(): void {
    const storage = safeGetLocalStorage();
    if (!storage) return;
    storage.removeItem(STORAGE_KEY);
  }
}


