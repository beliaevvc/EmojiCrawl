/**
 * SellControl — правая панель продажи (SellZone + кнопка).
 *
 * Контекст (Блок 3.5): вынесено из `GameScreen`, чтобы правая колонка была отдельной частью.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - рендерит `SellZone` (DnD drop),
 * - внутри показывает кнопку “Продать” (или 🔒 при блокировке).
 *
 * Входы:
 * - `sellButtonRef` — нужен внешнему обработчику для позиционирования floating texts,
 * - `isSellBlocked` — блокировка (например scream),
 * - `onSell` — обработчик drop (обычно из `useSellDropHandler`).
 *
 * Инварианты:
 * - не содержит доменной логики,
 * - ref обязателен для сохранения поведения 1:1 (визуальный фидбек продажи).
 */

import type { RefObject } from 'react';
import { SellZone } from '../dnd/SellZone';

export function SellControl({
  sellButtonRef,
  isSellBlocked,
  onSell,
}: {
  sellButtonRef: RefObject<HTMLButtonElement>;
  isSellBlocked: boolean;
  onSell: (item: any) => void;
}) {
  return (
    <div className="flex items-center justify-center w-20 md:w-32">
      <SellZone onSell={onSell}>
        <button
          ref={sellButtonRef}
          className={`group flex flex-col items-center gap-1 active:scale-95 transition-transform scale-75 md:scale-100 ${isSellBlocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          disabled={isSellBlocked}
        >
          <div
            className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-900/20 border-2 border-rose-500/50 flex items-center justify-center text-xl md:text-3xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all ${!isSellBlocked ? 'group-hover:bg-rose-900/40 group-hover:border-rose-400' : ''}`}
          >
            {isSellBlocked ? '🔒' : '💎'}
          </div>
          <span className="min-w-[70px] text-center text-[10px] md:text-xs font-bold tracking-widest text-rose-300 group-hover:text-rose-200 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm uppercase">
            {isSellBlocked ? 'БЛОК' : 'Продать'}
          </span>
        </button>
      </SellZone>
    </div>
  );
}


