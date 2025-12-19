/**
 * useSellDropHandler — обработчик drop в SellZone (продажа предмета).
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы правила продажи были отдельно.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - проверяет блокировки/валидаторы на свежем состоянии (через `stateRef`),
 * - при успехе вызывает команду продажи (`onSellCard`),
 * - при необходимости показывает floating-text у кнопки продажи.
 *
 * Инварианты:
 * - поведение 1:1 со старым `GameScreen`,
 * - хук не знает про домен: он только валидирует UI-дроп и дергает внешний callback.
 */

import { useCallback } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type { GameState } from '@/types/game';

export function useSellDropHandler({
  stateRef,
  sellButtonRef,
  addFloatingText,
  onSellCard,
}: {
  stateRef: MutableRefObject<GameState>;
  sellButtonRef: RefObject<HTMLButtonElement>;
  addFloatingText: (x: number, y: number, text: string, color: string, centered?: boolean, scale?: number) => void;
  onSellCard: (cardId: string) => void;
}) {
  return useCallback(
    (item: any) => {
      const currentState = stateRef.current;

      /**
       * Важно: колбэк приходит из DnD и может жить “долго”.
       * Поэтому все проверки делаем по свежему `stateRef.current`,
       * а не по значениям из замыкания.
       */
      const isCurrentSellBlocked = currentState.enemySlots.some(
        (card) => card && card.type === 'monster' && card.ability === 'scream'
      );

      if (isCurrentSellBlocked) {
        return;
      }

      // Отладочный лог (исторически был в `GameScreen`): помогает ловить редкие кейсы с location у DnD-item.
      console.log('Attempting sell:', item.id, 'Location:', item.location);

      /**
       * Запрещаем продавать экипированные предметы из рук.
       * Проверяем двумя способами:
       * - по `item.location`, если его корректно поставил drag-source,
       * - по id в `leftHand/rightHand` как fallback (на случай если source не проставил location).
       *
       * Это защита от “случайной продажи” при дропе рядом с SellZone.
       */
      if (
        item.location === 'hand' ||
        currentState.leftHand.card?.id === item.id ||
        currentState.rightHand.card?.id === item.id
      ) {
        return;
      }

      /**
       * Запрещаем продавать “заблокированные” предметы из рюкзака.
       * Например: некоторые карты могут блокироваться на ход (или становиться недоступными),
       * и раньше это тоже не продавалось.
       */
      if (currentState.backpack.card?.id === item.id && currentState.backpack.blocked) {
        return;
      }

      /**
       * Особое правило: череп нельзя продавать из рюкзака.
       * (Смысл: это скорее трофей/артефакт/состояние, чем “товар”.)
       */
      if (item.type === 'skull' && (item.location === 'backpack' || currentState.backpack.card?.id === item.id)) {
        return;
      }

      /**
       * UX: для “нулевых продаж” (спеллы/монеты/череп) показываем короткий floating-text возле кнопки продажи,
       * чтобы было ясно, что дроп сработал (даже если денег не прибавилось).
       */
      let fxX = window.innerWidth - 85;
      let fxY = window.innerHeight - 110;

      if (sellButtonRef.current) {
        const rect = sellButtonRef.current.getBoundingClientRect();
        fxX = rect.left + rect.width / 2;
        fxY = rect.top - 30;
      }

      if (item.type === 'spell') {
        addFloatingText(
          fxX,
          fxY,
          'Сброшено',
          'text-indigo-300 font-bold text-[11px] tracking-widest uppercase bg-black/80 px-2 py-0.5 rounded border border-indigo-500/30 backdrop-blur-sm shadow-sm origin-bottom',
          true,
          1.0
        );
      } else if (item.type === 'coin') {
        addFloatingText(
          fxX,
          fxY,
          'Спасибо',
          'text-amber-300 font-bold text-[11px] tracking-widest uppercase bg-black/80 px-2 py-0.5 rounded border border-amber-500/30 backdrop-blur-sm shadow-sm origin-bottom',
          true,
          1.0
        );
      } else if (item.type === 'skull') {
        addFloatingText(
          fxX,
          fxY,
          'Спасибо',
          'text-stone-400 font-bold text-[11px] tracking-widest uppercase bg-black/80 px-2 py-0.5 rounded border border-stone-500/30 backdrop-blur-sm shadow-sm origin-bottom',
          true,
          1.0
        );
      }

      onSellCard(item.id);
    },
    [stateRef, sellButtonRef, addFloatingText, onSellCard]
  );
}


