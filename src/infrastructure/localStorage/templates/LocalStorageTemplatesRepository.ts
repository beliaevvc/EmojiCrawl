/**
 * LocalStorageTemplatesRepository — infrastructure адаптер для шаблонов колод.
 *
 * ### Что это
 * Реализация порта `TemplatesRepository` через `window.localStorage`.
 *
 * ### Зачем это нужно (Блок 5)
 * UI (Deckbuilder/LoadTemplateModal) исторически использовал `utils/storage.ts`.
 * В Блоке 5 мы хотим, чтобы:
 * - UI не знал про конкретный storage,
 * - I/O был в инфраструктуре,
 * - application слой мог быть протестирован с мок-репозиторием.
 *
 * ### Формат хранения
 * Один ключ: `skazmor_templates`, значение — JSON массив `DeckTemplate[]`.
 *
 * ### Безопасность/ограничения
 * - В окружениях без `window/localStorage` (SSR/тесты) репозиторий возвращает пустые значения.
 * - Любые ошибки JSON/доступа ловим try/catch (не ломаем UI).
 */

import type { DeckTemplate } from '@/types/game';
import type { TemplatesRepository } from '@/features/templates/application';

const STORAGE_KEY = 'skazmor_templates';

function safeGetLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export class LocalStorageTemplatesRepository implements TemplatesRepository {
  getAll(): DeckTemplate[] {
    const storage = safeGetLocalStorage();
    if (!storage) return [];

    try {
      const stored = storage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? (parsed as DeckTemplate[]) : [];
    } catch (e) {
      console.error('Failed to load templates', e);
      return [];
    }
  }

  save(template: DeckTemplate): void {
    const storage = safeGetLocalStorage();
    if (!storage) return;

    const templates = this.getAll();
    const newTemplates = [...templates, template];
    storage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  }

  delete(id: string): void {
    const storage = safeGetLocalStorage();
    if (!storage) return;

    const templates = this.getAll();
    const newTemplates = templates.filter((t) => t.id !== id);
    storage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  }
}


