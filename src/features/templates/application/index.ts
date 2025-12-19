/**
 * Templates Application Layer (public API).
 *
 * ### Что это
 * Публичная точка входа application слоя для templates-фичи.
 *
 * ### Зачем
 * UI должен зависеть от application API (use-cases), а инфраструктура (LocalStorage)
 * реализует порт `TemplatesRepository`.
 */

export * from './templatesUseCases';
export * from './ports/TemplatesRepository';


