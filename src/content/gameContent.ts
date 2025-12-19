/**
 * Content Layer — GameContent контейнер и сборщик content packs.
 *
 * Слой: Content (данные).
 *
 * ## Что это
 * “Контейнер контента” — структурированный объект `GameContent`, который содержит
 * статические данные игры (заклинания/проклятия/способности монстров) в удобном виде:
 * - списки (`spells`, `curses`, `monsterAbilities`)
 * - индексы по id (`*ById`)
 * - дополнительные списки (например `baseSpellIds`)
 *
 * Контекст (Блок 4): мы уходим от прямых импортов `src/data/*` из domain/application.
 * Вместо этого контент собирается в единый контейнер `GameContent`, который:
 * - создаётся “снаружи” домена (в content/application),
 * - передаётся внутрь application/use-cases как зависимость,
 * - используется UI для пикеров/энциклопедии/описаний.
 *
 * Почему так:
 * - можно иметь несколько наборов контента (base/story/event/balance_test),
 * - домен остаётся “чистым”: он не знает, откуда берётся контент,
 * - UI может получать данные для пикеров/энциклопедии через контейнер, не цепляясь к `src/data/*`.
 *
 * Важно:
 * - `GameContent` — это **про данные**, а не про механику.
 * - Здесь НЕ должно появляться “если проклятие X — сделай Y”. Это место домена.
 * - `src/data/*` может оставаться как deprecated‑мост для старых импортов, но **новый код**
 *   должен работать через `src/content/*` и `GameContent`.
 *
 * ## Что делает `createGameContent`
 * - Собирает выбранный pack (пока реализован только `base`),
 * - валидирует уникальность id (через `indexById`),
 * - возвращает объект `GameContent` с единым контрактом.
 *
 * ## Как расширять (когда будем добавлять новые pack’и)
 * - Добавить новые модули/переопределения под packId (например `story`),
 * - гарантировать те же поля в `GameContent`,
 * - UI и application продолжат работать через `content.*` без переписывания импортов.
 */
import type { SpellType } from '@/features/game/domain/model/types';
import { BASE_CURSES } from './curses';
import { BASE_SPELL_DEFINITIONS, BASE_SPELL_IDS } from './spells';
import { BASE_MONSTER_ABILITIES } from './monsterAbilities';
import type { CurseDefinition, MonsterAbilityDefinition, SpellDefinition } from './definitions';

export type ContentPackId = 'base' | 'story' | 'event' | 'balance_test';

export type GameContent = {
  packId: ContentPackId;

  spells: SpellDefinition[];
  baseSpellIds: SpellType[];
  spellsById: Record<string, SpellDefinition>;

  curses: CurseDefinition[];
  cursesById: Record<string, CurseDefinition>;

  monsterAbilities: MonsterAbilityDefinition[];
  monsterAbilitiesById: Record<string, MonsterAbilityDefinition>;
};

function indexById<T extends { id: string }>(items: T[], label: string): Record<string, T> {
  const byId: Record<string, T> = {};
  for (const item of items) {
    if (byId[item.id]) {
      throw new Error(`[GameContent] duplicate id in ${label}: "${item.id}"`);
    }
    byId[item.id] = item;
  }
  return byId;
}

/**
 * Создаёт контейнер контента для выбранного пакета.
 *
 * На текущем шаге поддерживаем только `base` (остальные packId зарезервированы),
 * но API сделан так, чтобы позже добавлять новые пакеты без переписывания UI.
 *
 * Как расширять:
 * - добавляешь новый packId (например `story`) и его “сборку” (какие модули включены/что переопределено),
 * - возвращаешь `GameContent` с тем же контрактом (`*ById`, `baseSpellIds` и т.д.),
 * - UI продолжает работать через `content.*` без прямых импортов.
 */
export function createGameContent(packId: ContentPackId = 'base'): GameContent {
  if (packId !== 'base') {
    // Пока — безопасный fallback: чтобы новый API не ломал ранние эксперименты.
    // В Блоке 4 позже добавим реальные pack-конфиги.
    packId = 'base';
  }

  const spells: SpellDefinition[] = BASE_SPELL_DEFINITIONS;

  const curses: CurseDefinition[] = BASE_CURSES;

  const monsterAbilities: MonsterAbilityDefinition[] = BASE_MONSTER_ABILITIES;

  return {
    packId,

    spells,
    baseSpellIds: BASE_SPELL_IDS,
    spellsById: indexById(spells, 'spells'),

    curses,
    cursesById: indexById(curses, 'curses'),

    monsterAbilities,
    monsterAbilitiesById: indexById(monsterAbilities, 'monsterAbilities'),
  };
}


