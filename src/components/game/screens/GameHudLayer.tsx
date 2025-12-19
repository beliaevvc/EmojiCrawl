/**
 * GameHudLayer — HUD-слой экрана боя (верхняя панель + плавающие окна + нижняя панель).
 *
 * Контекст (Блок 3): вынос HUD из `GameScreen`, чтобы экран стал “компоновкой”.
 *
 * Слой: UI (React). Компонент-компоновщик.
 *
 * Что делает:
 * - рендерит `GameTopBar` (верхняя панель),
 * - рендерит `HudWindows` (плавающие окна),
 * - рендерит `GameBottomBar` (нижняя панель).
 *
 * Входы:
 * - `topBar/windows/bottomBar` — пропсы соответствующих компонентов (готовый view-model).
 *
 * Инварианты:
 * - не содержит игровой логики, только композиция,
 * - поведение 1:1 — тонкая обёртка вокруг уже существующих компонентов.
 */
import type { ComponentProps } from 'react';
import { GameTopBar } from '../hud/GameTopBar';
import { HudWindows } from '../hud/HudWindows';
import { GameBottomBar } from '../hud/GameBottomBar';

export type GameHudLayerProps = {
  topBar: ComponentProps<typeof GameTopBar>;
  windows: ComponentProps<typeof HudWindows>;
  bottomBar: ComponentProps<typeof GameBottomBar>;
};

export function GameHudLayer({ topBar, windows, bottomBar }: GameHudLayerProps) {
  return (
    /**
     * HUD-слой должен жить “поверх” сцены боя:
     * - верхняя панель прибита к верху,
     * - нижняя системная панель (New Game / Пауза / Правила / Info) прибита к низу,
     * - плавающие окна (лог/статы/вьюверы) рисуются поверх поля.
     *
     * Поэтому держим общий контейнер абсолютным, а pointer-events включаем только там, где нужно,
     * чтобы HUD не ломал drag&drop на поле.
     */
    <div className="absolute inset-0 z-20 pointer-events-none">
      <GameTopBar {...topBar} />
      <div className="pointer-events-auto">
        <HudWindows {...windows} />
      </div>
      <GameBottomBar {...bottomBar} />
    </div>
  );
}


