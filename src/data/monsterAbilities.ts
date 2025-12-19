/**
 * @deprecated Блок 4 (Content Layer): monsterAbilities переехали в `src/content/monsterAbilities/*`.
 *
 * Оставлено как “мост” для обратной совместимости:
 * - старые файлы могли импортить `MONSTER_ABILITIES` из `src/data/monsterAbilities.ts`,
 * - на время рефакторинга мы оставляем этот путь рабочим, чтобы не ломать UI/редакторы.
 *
 * Новому коду нельзя импортить отсюда.
 * Вместо этого:
 * - для UI: используем `baseGameContent.monsterAbilities` / `baseGameContent.monsterAbilitiesById`,
 * - для сборки паков: `src/content/monsterAbilities/baseMonsterAbilities.ts`.
 */
export { BASE_MONSTER_ABILITIES as MONSTER_ABILITIES } from '@/content/monsterAbilities';
export type { MonsterAbilityDefinition as AbilityDefinition } from '@/content';

