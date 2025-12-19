/**
 * Content Layer — monsterAbilities module (публичный вход).
 *
 * Почему есть отдельный index:
 * - единая точка импорта для модуля способностей монстров,
 * - позже можно добавить разные pack’и/оверрайды, не меняя потребителей.
 */
export * from './baseMonsterAbilities';


