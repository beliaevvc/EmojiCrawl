/**
 * SellZone — DnD drop-zone для продажи (правая колонка).
 *
 * Контекст (Блок 3): вынос DnD-обвязки из `GameScreen`.
 *
 * Слой: UI (React + react-dnd).
 *
 * Что делает:
 * - регистрирует drop-target для `ItemTypes.CARD`,
 * - на drop вызывает внешний `onSell(item)`.
 *
 * Что НЕ делает:
 * - не решает “можно ли продавать” (scream и т.п.) — это в `useSellDropHandler`,
 * - не начисляет 💎 и не меняет state — это делает reducer через command.
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/DragTypes';

export function SellZone({ onSell, children }: { onSell: (item: any) => void; children: React.ReactNode }) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      drop: (item: any) => onSell(item),
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [onSell]
  );

  return (
    <div ref={drop} className={isOver ? 'scale-110 transition-transform' : ''}>
      {children}
    </div>
  );
}


