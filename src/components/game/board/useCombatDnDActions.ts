/**
 * useCombatDnDActions — обработчики DnD/интеракций боя (drop на руки/монстров/героя).
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы DnD-логика не жила в экране.
 *
 * Слой: UI (React). Команды отправляются через `dispatch(gameSession.*)`.
 *
 * Что делает:
 * - обрабатывает drop карты в левую/правую руку/рюкзак,
 * - обрабатывает действия по монстру/щитам/герою (оружие/спеллы/прочее),
 * - учитывает запреты (например stealth block) перед взаимодействиями,
 * - читает актуальный state через `stateRef` (защита от stale-closure).
 *
 * Инварианты:
 * - поведение 1:1 со старой реализацией,
 * - сама логика применения/эффектов остаётся в reducer/domain, здесь только маршрутизация UI-ивентов.
 */

import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { GameAction, GameState } from '@/types/game';
import { gameSession } from '@/features/game/application';

type Hand = 'left' | 'right' | 'backpack';
type InteractionTarget = 'player' | 'shield_left' | 'shield_right' | 'weapon_left' | 'weapon_right';

export function useCombatDnDActions({
  stateRef,
  dispatch,
  checkStealthBlock,
}: {
  stateRef: MutableRefObject<GameState>;
  dispatch: React.Dispatch<GameAction>;
  checkStealthBlock: (monsterId: string) => boolean;
}) {
  const handleDropToHand = useCallback(
    (hand: Hand) => (item: any) => {
      const currentState = stateRef.current;

      const targetCard =
        hand === 'left'
          ? currentState.leftHand.card
          : hand === 'right'
            ? currentState.rightHand.card
            : currentState.backpack.card;

      // Traveling Merchant: “🚪 Уйти” — только в ПУСТОЙ слот инвентаря.
      if (currentState.merchant?.isActive && item?.merchantAction === 'leave') {
        if (!targetCard) {
          dispatch(gameSession.leaveMerchant());
        }
        return;
      }

      // Traveling Merchant: покупка товара (DnD оффера в ПУСТОЙ слот инвентаря).
      if (currentState.merchant?.isActive && item?.merchantOfferType) {
        if (!targetCard) {
          dispatch(gameSession.buyMerchantOffer({ offerId: item.id, targetHand: hand }));
        }
        return;
      }

      if (!targetCard) {
        dispatch(gameSession.takeCardToHand({ cardId: item.id, hand }));
      } else {
        if (item.type === 'spell') {
          dispatch(gameSession.useSpellOnTarget({ spellCardId: item.id, targetId: targetCard.id }));
        } else if (item.type === 'prayer_spell' && targetCard.type === 'spell') {
          dispatch(gameSession.castPrayer({ prayerCardId: item.id, targetSpellCardId: targetCard.id }));
        }
      }
    },
    [stateRef, dispatch]
  );

  const handleMonsterInteraction = useCallback(
    (target: InteractionTarget) => (item: any) => {
      // Traveling Merchant: “🚪 Уйти” закрывает торговца при drop на героя.
      if (target === 'player') {
        const currentState = stateRef.current;
        if (currentState.merchant?.isActive && item?.merchantAction === 'leave') {
          dispatch(gameSession.leaveMerchant());
          return;
        }
      }

      if (item.type === 'monster') {
        if (checkStealthBlock(item.id)) {
          return;
        }

        dispatch({
          type: 'INTERACT_WITH_MONSTER',
          monsterId: item.id,
          target,
        });
      } else if (item.type === 'spell' && target === 'player') {
        dispatch(gameSession.useSpellOnTarget({ spellCardId: item.id, targetId: 'player' }));
      } else if (item.type === 'bravery_potion' && target === 'player') {
        dispatch(gameSession.useBraveryPotion({ potionCardId: item.id }));
      }
    },
    [stateRef, dispatch, checkStealthBlock]
  );

  const handleDropOnEnemy = useCallback(
    (item: any, targetId: string) => {
      const currentState = stateRef.current;

      if (item.type === 'spell') {
        if (checkStealthBlock(targetId)) {
          return;
        }

        dispatch(gameSession.useSpellOnTarget({ spellCardId: item.id, targetId }));
      } else if (item.type === 'weapon') {
        if (checkStealthBlock(targetId)) {
          return;
        }

        /**
         * Оружие “применяется” к монстру через доменное действие `INTERACT_WITH_MONSTER`,
         * но целевой `target` зависит от того, в какой руке лежит оружие.
         *
         * Поэтому на UI-слое определяем “сторону” по текущему state и мапим в `weapon_left/weapon_right`.
         * (Поведение 1:1 со старым `GameScreen`.)
         */
        let handSide: 'left' | 'right' | null = null;
        if (currentState.leftHand.card?.id === item.id) handSide = 'left';
        else if (currentState.rightHand.card?.id === item.id) handSide = 'right';

        if (handSide) {
          dispatch({
            type: 'INTERACT_WITH_MONSTER',
            monsterId: targetId,
            target: handSide === 'left' ? 'weapon_left' : 'weapon_right',
          });
        }
      } else if (item.type === 'claymore') {
        if (checkStealthBlock(targetId)) {
          return;
        }

        // Клеймор действует как оружие, но остаётся в руке и теряет прочность в домене.
        let handSide: 'left' | 'right' | null = null;
        if (currentState.leftHand.card?.id === item.id) handSide = 'left';
        else if (currentState.rightHand.card?.id === item.id) handSide = 'right';

        if (handSide) {
          dispatch({
            type: 'INTERACT_WITH_MONSTER',
            monsterId: targetId,
            target: handSide === 'left' ? 'weapon_left' : 'weapon_right',
          });
        }
      }
    },
    [stateRef, dispatch, checkStealthBlock]
  );

  return { handleDropToHand, handleMonsterInteraction, handleDropOnEnemy };
}


