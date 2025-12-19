/**
 * Templates use-cases (application слой).
 *
 * ### Что это
 * Application API для работы с шаблонами колод (get/save/delete).
 *
 * ### Зачем
 * Сейчас логика минимальна и просто делегирует в репозиторий,
 * но use-cases дают стабильную точку расширения для будущих правил:
 * - валидация имени/структуры шаблона,
 * - дедупликация по id,
 * - миграции формата шаблона.
 */

import type { TemplatesRepository } from './ports/TemplatesRepository';

export function createTemplatesUseCases(repository: TemplatesRepository) {
  return {
    getTemplates: () => repository.getAll(),
    saveTemplate: (template: Parameters<TemplatesRepository['save']>[0]) => repository.save(template),
    deleteTemplate: (id: string) => repository.delete(id),
  };
}


