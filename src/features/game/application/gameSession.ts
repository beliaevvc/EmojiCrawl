/**
 * Game Application Layer — GameSession (переходный фасад).
 *
 * Слой: Application.
 *
 * ## Что это
 * Набор “команд” (use-case API) уровня приложения, которые UI может вызывать,
 * не зная деталей доменных action’ов.
 *
 * Технически на текущем этапе это фасад, который:
 * - принимает входные параметры (input),
 * - возвращает доменный `GameAction`,
 * - который дальше применяется domain reducer’ом (`gameReducer`).
 *
 * ## Зачем
 * - Снизить связанность UI с доменными деталями (`dispatch({type: ...})` везде).
 * - Иметь единое место, где можно постепенно добавлять “правила приложения”
 *   и оркестрацию, не переписывая UI.
 *
 * ## Где хранится состояние
 * Важно: **здесь состояние игры не хранится.**
 * Владение `GameState` сейчас находится в `GameSessionProvider` (React‑адаптер application слоя),
 * а он уже подключается на границе game‑ветки (`GameFlowRoot`, Блок 6).
 *
 * Зачем так:
 * - Минимальный риск: UI почти не меняем, поведение игры не трогаем.
 * - Постепенно переносим UI с `dispatch({type: ...})` на `session.command(...)`.
 *
 * Дополнение (Блок 4 — Content Layer):
 * - domain слой не должен импортить `src/data/*` и `src/content/*` напрямую,
 * - но при старте игры нужно собрать колоду и заполнить “презентационные” поля (иконки/имена/описания)
 *   для spell-карт и для кастомных групп монстров.
 *
 * Поэтому именно здесь (в application слое) мы:
 * - берём `baseGameContent` (контейнер контента),
 * - формируем минимальный snapshot `action.content` для `START_GAME`,
 * - формируем `curseMeta` для `ACTIVATE_CURSE`.
 *
 * Это компромисс Блока 4:
 * - механика остаётся в domain reducer (правила боя),
 * - данные отображения приходят “снаружи” через action, чтобы домен оставался чистым.
 *
 * Следующие шаги:
 * - Этот модуль может постепенно эволюционировать из “маппера action’ов” в набор настоящих
 *   use-case’ов (с валидациями/оркестрацией), но доменные правила по-прежнему должны оставаться в domain.
 */

import type { CurseType, DeckConfig, GameAction, MonsterAbilityMeta, SpellMeta } from '@/features/game/domain/model/types';
import { baseGameContent } from './gameContent';

export type StartGameInput = {
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
};

export type TakeCardToHandInput = {
  cardId: string;
  hand: 'left' | 'right' | 'backpack';
};

export type UseSpellOnTargetInput = {
  spellCardId: string;
  targetId: string;
};

export type SellItemInput = {
  cardId: string;
};

export type BuyMerchantOfferInput = {
  offerId: string;
  targetHand: 'left' | 'right' | 'backpack';
};

export type UseBraveryPotionInput = {
  potionCardId: string;
};

export type CastPrayerInput = {
  prayerCardId: string;
  targetSpellCardId: string;
};

export const gameSession = {
  startGame: (input: StartGameInput): GameAction => {
    // Блок 4: строим snapshot контента, который нужен domain только на этапе START_GAME.
    // Это позволяет domain собрать колоду без прямых импортов `data/*`.
    const spellsById: Record<string, SpellMeta> = {};
    for (const s of baseGameContent.spells) {
      spellsById[s.id] = { name: s.name, description: s.description, icon: s.icon };
    }

    const monsterAbilitiesById: Record<string, MonsterAbilityMeta> = {};
    for (const a of baseGameContent.monsterAbilities) {
      monsterAbilitiesById[a.id] = { name: a.name, description: a.description, icon: a.icon };
    }

    return {
    type: 'START_GAME',
    deckConfig: input.deckConfig,
    runType: input.runType,
    templateName: input.templateName,
      // Блок 4: стартовая сборка колоды требует meta (name/icon/description) для spell-карт.
      // Прокидываем это через action, чтобы domain не импортил `data/*`.
      content: {
        baseSpellIds: baseGameContent.baseSpellIds,
        spellsById,
        monsterAbilitiesById,
      },
    };
  },

  takeCardToHand: (input: TakeCardToHandInput): GameAction => ({
    type: 'TAKE_CARD_TO_HAND',
    cardId: input.cardId,
    hand: input.hand,
  }),

  useSpellOnTarget: (input: UseSpellOnTargetInput): GameAction => ({
    type: 'USE_SPELL_ON_TARGET',
    spellCardId: input.spellCardId,
    targetId: input.targetId,
  }),

  sellItem: (input: SellItemInput): GameAction => ({
    type: 'SELL_ITEM',
    cardId: input.cardId,
  }),

  /**
   * Traveling Merchant: “🚪 Уйти”.
   * Закрывает overlay торговца и продолжает обычный добор раунда.
   */
  leaveMerchant: (): GameAction => ({
    type: 'MERCHANT_LEAVE',
  }),

  /**
   * Traveling Merchant: покупка товара (DnD оффера в пустой слот).
   */
  buyMerchantOffer: (input: BuyMerchantOfferInput): GameAction => ({
    type: 'MERCHANT_BUY',
    offerId: input.offerId,
    targetHand: input.targetHand,
  }),

  useBraveryPotion: (input: UseBraveryPotionInput): GameAction => ({
    type: 'USE_BRAVERY_POTION',
    potionCardId: input.potionCardId,
  }),

  castPrayer: (input: CastPrayerInput): GameAction => ({
    type: 'CAST_PRAYER',
    prayerCardId: input.prayerCardId,
    targetSpellCardId: input.targetSpellCardId,
  }),

  resetHand: (): GameAction => ({
    type: 'RESET_HAND',
  }),

  activateCurse: (curse: CurseType): GameAction => {
    const def = baseGameContent.cursesById[curse];
    return {
    type: 'ACTIVATE_CURSE',
    curse,
      // В Блоке 4 domain больше не импортит `data/curses` ради имени/иконки для лога.
      // Поэтому прокидываем presentation-мету снаружи (из application слоя).
      curseMeta: def ? { name: def.name, icon: def.icon, color: def.color } : undefined,
    };
  },
};


