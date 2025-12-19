/**
 * TemplatesRepository — порт application слоя для сохранённых шаблонов колод.
 *
 * ### Зачем (Блок 5)
 * Мы хотим, чтобы UI (Deckbuilder и модалки шаблонов) не зависели от LocalStorage напрямую.
 * Поэтому:
 * - интерфейс хранения определён здесь (application),
 * - реализация находится в `infrastructure/localStorage/templates/*`,
 * - UI вызывает use-cases (или bridge-утилиту `utils/storage.ts`).
 *
 * ### Состав операций
 * Нам нужен простой CRUD:
 * - список всех шаблонов,
 * - добавить шаблон,
 * - удалить шаблон.
 */

import type { DeckTemplate } from '@/types/game';

export interface TemplatesRepository {
  getAll(): DeckTemplate[];
  save(template: DeckTemplate): void;
  delete(id: string): void;
}


