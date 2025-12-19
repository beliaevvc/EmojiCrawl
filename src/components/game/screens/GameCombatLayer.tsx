/**
 * GameCombatLayer — боевая компоновка экрана (левая панель + доска + продажа).
 *
 * Контекст (Блок 3): вынос боевого layout из `GameScreen`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React). Компонент-компоновщик.
 *
 * Что делает:
 * - собирает `CombatLayout` из трёх частей:
 *   - `LeftControls` (проклятие/сброс руки),
 *   - `GameBoard` (поле боя, DnD, аватар),
 *   - `SellControl` (зона/кнопка продажи).
 *
 * Входы:
 * - `leftControls/board/sellControl` — пропсы соответствующих компонентов (готовый view-model).
 *
 * Инварианты:
 * - логика игры не живёт здесь (только композиция),
 * - поведение 1:1 — это “тонкая сборка” существующих частей.
 */
import type { ComponentProps } from 'react';
import { CombatLayout } from '../board/CombatLayout';
import { LeftControls } from '../board/LeftControls';
import { GameBoard } from '../board/GameBoard';
import { SellControl } from '../board/SellControl';

export type GameCombatLayerProps = {
  leftControls: ComponentProps<typeof LeftControls>;
  board: ComponentProps<typeof GameBoard>;
  sellControl: ComponentProps<typeof SellControl>;
};

export function GameCombatLayer({ leftControls, board, sellControl }: GameCombatLayerProps) {
  return (
    <CombatLayout
      left={<LeftControls {...leftControls} />}
      center={<GameBoard {...board} />}
      right={<SellControl {...sellControl} />}
    />
  );
}


