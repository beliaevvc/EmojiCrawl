/**
 * EnemySlotDropZone — DnD drop-zone для слота монстра.
 *
 * Контекст (Блок 3): вынос DnD-обвязки из `GameScreen`, чтобы экран не держал
 * низкоуровневый react-dnd код и оставался “экраном‑компоновкой”.
 *
 * Слой: UI (React + react-dnd).
 *
 * Что делает:
 * - регистрирует drop-target для `ItemTypes.CARD`,
 * - разрешает drop только когда:
 *   - предмет является weapon/spell (см. `canDrop`),
 *   - target-слот реально содержит карту монстра,
 * - на drop вызывает внешний колбэк `onDropOnEnemy(item, targetId)`.
 *
 * Что НЕ делает:
 * - не применяет правила боя, не мутирует state, не вызывает reducer напрямую.
 *   Вся игровая логика — выше (контроллер/хуки) и в domain reducer.
 *
 * Инварианты:
 * - поведение 1:1 со старой inline‑реализацией в `GameScreen` (только перенос),
 * - визуальные подсветки (isOver/canDrop) остаются локальными.
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/DragTypes';
import type { Card } from '@/types/game';

export function EnemySlotDropZone({
  card,
  onDropOnEnemy,
  children,
}: {
  card: Card | null;
  onDropOnEnemy: (item: any, targetId: string) => void;
  children: React.ReactNode;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      /**
       * Разрешаем дропать на монстра:
       * - спеллы,
       * - оружие (только если в слоте действительно монстр).
       *
       * Блокировка “Туман”: скрытые (`isHidden`) карты недоступны для взаимодействия.
       */
      canDrop: (item: any) =>
        !!card && !card.isHidden && (item.type === 'spell' || (item.type === 'weapon' && card.type === 'monster')),
      drop: (item: any) => {
        if (card && !card.isHidden) onDropOnEnemy(item, card.id);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [card, onDropOnEnemy]
  );

  return (
    <div
      ref={drop}
      className={`relative w-full h-full flex items-center justify-center ${
        isOver && canDrop ? 'ring-2 ring-indigo-400 rounded-full scale-105 transition-transform' : ''
      }`}
    >
      {children}
    </div>
  );
}


