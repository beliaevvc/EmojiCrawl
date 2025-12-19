/**
 * @deprecated Блок 4 (Content Layer): spells переехали в `src/content/spells/*`.
 *
 * Оставлено как “мост” для обратной совместимости:
 * - старые файлы могли импортить `SPELLS/BASE_SPELLS` из `src/data/spells.ts`,
 * - на время рефакторинга мы оставляем этот путь рабочим, чтобы избежать массовых правок.
 *
 * Новому коду нельзя импортить отсюда.
 * Вместо этого:
 * - для UI: используем `baseGameContent.spells` / `baseGameContent.spellsById`,
 * - для сборки паков: `src/content/spells/baseSpells.ts`.
 */
export { BASE_SPELL_DEFINITIONS as SPELLS, BASE_SPELL_IDS as BASE_SPELLS } from '@/content/spells';
export type { SpellDefinition } from '@/content';

