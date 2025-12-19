/**
 * @deprecated Блок 4 (Content Layer): curses переехали в `src/content/curses/*`.
 *
 * Оставлено как “мост” для обратной совместимости:
 * - старые файлы могли импортить `CURSES` из `src/data/curses.ts`,
 * - на время рефакторинга мы оставляем этот путь рабочим, чтобы не ломать UI/доменные участки массово.
 *
 * Новому коду нельзя импортить отсюда.
 * Вместо этого:
 * - для UI: используем `baseGameContent.curses` / `baseGameContent.cursesById`,
 * - для сборки паков: `src/content/curses/baseCurses.ts`.
 */
export { BASE_CURSES as CURSES } from '@/content/curses';
export type { CurseDefinition as CurseDef } from '@/content';

