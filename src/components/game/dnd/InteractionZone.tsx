/**
 * InteractionZone — универсальная DnD drop-zone для “целей взаимодействия”.
 *
 * Контекст (Блок 3): вынос DnD-обвязки из `GameScreen`, чтобы экран не держал
 * низкоуровневый react-dnd код и оставался компоновкой.
 *
 * Слой: UI (React + react-dnd).
 *
 * Что делает:
 * - создаёт drop-target для заданного набора типов `accepts`,
 * - вызывает `onDrop(item)` при drop,
 * - защищается от “двойного drop” через `monitor.didDrop()`.
 *
 * Где используется:
 * - “drop на героя”,
 * - “drop на щит/слот взаимодействия”,
 * - любые другие зоны, которые зависят от места рендера (а не от домена).
 *
 * Что НЕ делает:
 * - не проверяет игровые правила (stealth/fog/silence и т.д.) — это выше (контроллер/хуки),
 * - не меняет `GameState` напрямую.
 */

import React from 'react';
import { useDrop } from 'react-dnd';

export function InteractionZone({
  onDrop,
  accepts,
  children,
  className = '',
}: {
  onDrop: (item: any) => void;
  accepts: string[];
  children: React.ReactNode;
  className?: string;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: accepts,
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) return;
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`${className} ${isOver && canDrop ? 'ring-4 ring-rose-500/50 rounded-full' : ''}`}
    >
      {children}
    </div>
  );
}


