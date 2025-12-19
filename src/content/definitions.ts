/**
 * Content Layer — контракты Definition для статического контента (данные/описания).
 *
 * Слой: Content (контракты).
 *
 * ## Что это
 * Набор типов `*Definition`, которые описывают статический контент:
 * - имя/описание/иконка/цвет (то, что нужно UI и “презентационной” части),
 * - **без** механики и вычислений.
 *
 * Зачем это нужно (Блок 4):
 * - мы хотим иметь “контент” отдельно от “механики” (domain reducer/rules),
 * - хотим уметь собирать разные наборы контента (content packs) без переписывания домена,
 * - хотим, чтобы UI мог отображать названия/описания/иконки, не импортируя `src/data/*`.
 *
 * Что такое *Definition:
 * - это описание сущности контента (например, заклинания/проклятия/способности монстра),
 * - в нём **нет логики** и “правил боя” — только данные для отображения и справки.
 *
 * Граница слоёв (важно):
 * - **Domain** НЕ должен импортить `src/content/*` и НЕ должен зависеть от этих типов напрямую.
 * - Content/Application могут зависеть от domain **только** в части идентификаторов (например `SpellType`).
 *
 * ## Инварианты / правила
 * - В `*Definition` нельзя добавлять функции/логику, только данные.
 * - Идентификаторы (`id`) берём из доменных union‑типов (`SpellType`, `CurseType`, ...),
 *   чтобы не “разъезжались” id между слоями.
 * - Любые изменения контента → обновляем `memory-bank/gameContent.md`.
 * - Любые изменения механики → обновляем `memory-bank/gameMechanics.md`.
 *
 * Практика:
 * - если добавляешь/меняешь контент (иконки/описания/цвета) — правь соответствующий файл в `src/content/*`,
 * - если меняешь механику (как работает эффект) — это уже domain reducer и `memory-bank/gameMechanics.md`.
 */
import type { CurseType, MonsterAbilityType, SpellType } from '@/features/game/domain/model/types';

export type SpellDefinition = {
  id: SpellType;
  name: string;
  description: string;
  icon: string;
};

export type CurseDefinition = {
  id: CurseType;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export type MonsterAbilityDefinition = {
  id: MonsterAbilityType;
  name: string;
  description: string;
  icon: string;
};


