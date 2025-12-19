/**
 * Content Layer — curses module (публичный вход).
 *
 * Почему есть отдельный index:
 * - единая точка импорта для модуля проклятий,
 * - проще расширять (добавим story/event наборы, overrides и т.д.) без изменений импортов.
 */
export * from './baseCurses';


