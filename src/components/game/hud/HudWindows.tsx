/**
 * HudWindows — слой плавающих HUD-окон (viewer/log/stats/labels).
 *
 * Контекст (Блок 3.5): вынос окон из `GameScreen`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - по флагам `hudVisibility` и `showInfo` рендерит окна:
 *   - `CardsViewer` (колода/сброс),
 *   - `OverheadStatsWindow` (овердеф/овердамаг/овер-хил),
 *   - `GameLogWindow` (лог событий),
 *   - `MonsterLabelsWindow` (лейблы монстров).
 * - прокидывает позиции окон и колбэки их изменения.
 *
 * Входы:
 * - данные для окон (`deck/discard/overheads/logs/labels`),
 * - `windowPositions` + `onPositionChange`,
 * - UI-флаги `showInfo/hudVisibility`.
 *
 * Инварианты:
 * - не содержит логики игры и side effects,
 * - только “условный рендер + прокидывание props”.
 */

import { AnimatePresence } from 'framer-motion';
import type { Card, LogEntry, MonsterLabelType, Overheads } from '@/types/game';
import type { HUDVisibility, WindowPosition } from '@/utils/uiStorage';
import { CardsViewer } from '../windows/CardsViewer';
import { GameLogWindow } from '../windows/GameLogWindow';
import { OverheadStatsWindow } from '../windows/OverheadStatsWindow';
import { MonsterLabelsWindow } from '@/components/MonsterLabelsWindow';

export type HudWindowsProps = {
  showInfo: boolean;
  hudVisibility: HUDVisibility;

  deck: Card[];
  discardPile: Card[];
  discardStats: Record<string, number>;

  overheads: Overheads;
  logs: LogEntry[];
  activeLabels: MonsterLabelType[];

  windowPositions: Record<string, WindowPosition | undefined>;
  onPositionChange: (key: 'deck' | 'discard' | 'stats' | 'log' | 'labels', pos: WindowPosition) => void;
};

export function HudWindows({
  showInfo,
  hudVisibility,
  deck,
  discardPile,
  discardStats,
  overheads,
  logs,
  activeLabels,
  windowPositions,
  onPositionChange,
}: HudWindowsProps) {
  return (
    <>
      {/* Колода / Сброс */}
      <AnimatePresence>
        {showInfo && (
          <>
            {hudVisibility.deckViewer && (
              <CardsViewer
                cards={deck}
                label="Колода"
                className="top-40"
                position={windowPositions['deck']}
                onPositionChange={(pos) => onPositionChange('deck', pos)}
              />
            )}
            {hudVisibility.discardViewer && (
              <CardsViewer
                cards={discardPile}
                label="Сброс"
                className="bottom-40"
                position={windowPositions['discard']}
                onPositionChange={(pos) => onPositionChange('discard', pos)}
                stats={hudVisibility.discardStats ? discardStats : undefined}
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Статы / Логи / Лейблы */}
      <AnimatePresence>
        {showInfo && (
          <>
            {hudVisibility.statsWindow && (
              <OverheadStatsWindow
                overheads={overheads}
                position={windowPositions['stats']}
                onPositionChange={(pos) => onPositionChange('stats', pos)}
              />
            )}
            {hudVisibility.logWindow && (
              <GameLogWindow
                logs={logs}
                position={windowPositions['log']}
                onPositionChange={(pos) => onPositionChange('log', pos)}
              />
            )}
            {hudVisibility.labelsWindow && (
              <MonsterLabelsWindow
                activeLabels={activeLabels}
                position={windowPositions['labels']}
                onPositionChange={(pos) => onPositionChange('labels', pos)}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}


