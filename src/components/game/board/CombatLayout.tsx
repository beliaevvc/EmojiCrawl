/**
 * CombatLayout — чистая компоновка “3 колонки” для боя.
 *
 * Контекст (Блок 3.5): вынос layout-структуры из `GameScreen`.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - размещает три ReactNode-слота: `left/center/right` в едином flex-layout.
 *
 * Входы:
 * - `left/center/right`: заранее собранные части экрана (контролы/доска/продажа).
 *
 * Инварианты:
 * - никаких правил игры и side effects,
 * - компонент должен оставаться максимально “глупым”, чтобы переиспользоваться в других экранах.
 */

import type { ReactNode } from 'react';

export function CombatLayout({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center w-full z-10 gap-2 md:gap-8 relative px-2 md:px-4">
      {left}
      {center}
      {right}
    </div>
  );
}


