/**
 * storage — временный bridge для обратной совместимости.
 *
 * ### Что это
 * Исторический набор утилит для LocalStorage:
 * - templates (шаблоны колод)
 * - run history (история забегов)
 *
 * ### Почему это bridge (Блок 5)
 * Раньше этот файл напрямую работал с `localStorage`.
 * В Блоке 5 (Infrastructure adapters) мы переносим I/O в `src/infrastructure/localStorage/*`,
 * чтобы внешний мир (LocalStorage) не был размазан по UI.
 *
 * Чтобы миграция была безопасной:
 * - этот файл оставлен как совместимый API для существующих импортов,
 * - но он больше НЕ содержит прямых `localStorage.*`,
 * - он делегирует в use-cases (`createTemplatesUseCases`, `createRunHistoryUseCases`)
 *   и инфраструктурные репозитории.
 *
 * ### Важно
 * Новый код предпочтительнее вести через application use-cases/порты напрямую,
 * а этот bridge со временем можно “сузить” или удалить, когда перепишем импорты.
 */

import type { DeckTemplate, RunHistoryEntry } from '@/types/game';
import { createTemplatesUseCases } from '@/features/templates/application';
import { LocalStorageTemplatesRepository } from '@/infrastructure/localStorage/templates/LocalStorageTemplatesRepository';
import { createRunHistoryUseCases } from '@/features/runHistory/application';
import { LocalStorageRunHistoryRepository } from '@/infrastructure/localStorage/runHistory/LocalStorageRunHistoryRepository';

const templatesUseCases = createTemplatesUseCases(new LocalStorageTemplatesRepository());
const runHistoryUseCases = createRunHistoryUseCases(new LocalStorageRunHistoryRepository());

// --- Templates ---

export const getTemplates = (): DeckTemplate[] => {
  return templatesUseCases.getTemplates();
};

export const saveTemplate = (template: DeckTemplate): void => {
  templatesUseCases.saveTemplate(template);
};

export const deleteTemplate = (id: string): void => {
  templatesUseCases.deleteTemplate(id);
};

// --- History (legacy API) ---

export const getRunHistory = (): RunHistoryEntry[] => {
  return runHistoryUseCases.getRunHistory();
};

export const saveRunToHistory = (entry: RunHistoryEntry): void => {
  runHistoryUseCases.saveEntry(entry);
};

export const clearRunHistory = (): void => {
  runHistoryUseCases.clearHistory();
};

