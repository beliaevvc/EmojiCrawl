/**
 * GameTopBar — верхняя HUD-панель экрана боя.
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - показывает “логотип/выход” (кнопка открытия confirm выхода),
 * - показывает счётчик оставшихся карт в колоде,
 * - опционально (в режиме Info) показывает breakdown по типам карт.
 *
 * Входы:
 * - `deckCount` — сколько осталось в колоде,
 * - `showInfo/showDeckStats` — флаги видимости деталей,
 * - `deckStats` — статистика по типам,
 * - `onOpenExitConfirm` — callback для открытия подтверждения выхода.
 *
 * Инварианты:
 * - не содержит логики игры; только отображение.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { DeckStatItem } from '@/components/game/hud/DeckStatItem';

export type DeckStats = Partial<Record<'monster' | 'coin' | 'potion' | 'shield' | 'weapon' | 'spell' | 'skull', number>>;

export function GameTopBar({
  deckCount,
  showInfo,
  showDeckStats,
  deckStats,
  onOpenExitConfirm,
}: {
  deckCount: number;
  showInfo: boolean;
  showDeckStats: boolean;
  deckStats: DeckStats;
  onOpenExitConfirm: () => void;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-between items-center z-20 w-full px-2 md:px-4 pt-2 md:pt-4 pointer-events-auto">
      <div className="flex items-center gap-4 md:gap-8">
        {/* --- Logo Button --- */}
        <button onClick={onOpenExitConfirm} className="group relative px-2 py-1">
          <span className="relative z-10 font-display font-bold text-2xl md:text-3xl text-stone-200 tracking-tighter uppercase drop-shadow-lg group-hover:text-rose-500 transition-colors">
            Skazmor
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-4 py-2 bg-stone-900/90 border border-stone-700 rounded shadow-lg backdrop-blur-sm">
            <span className="font-bold text-stone-400 text-base tracking-widest font-sans">ОСТАЛОСЬ</span>
            <div className="w-px h-4 bg-stone-700"></div>
            <span className="font-mono font-bold text-stone-100 text-base">{deckCount}</span>
          </div>

          {/* Deck Stats Breakdown */}
          <AnimatePresence>
            {showInfo && showDeckStats && (
              <motion.div
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                className="flex gap-1.5 overflow-hidden"
              >
                <DeckStatItem icon="🐺" count={deckStats.monster ?? 0} color="text-rose-400" />
                <DeckStatItem icon="💎" count={deckStats.coin ?? 0} color="text-amber-400" />
                <DeckStatItem icon="🧪" count={deckStats.potion ?? 0} color="text-emerald-400" />
                <DeckStatItem icon="🛡️" count={deckStats.shield ?? 0} color="text-stone-300" />
                <DeckStatItem icon="⚔️" count={deckStats.weapon ?? 0} color="text-stone-300" />
                <DeckStatItem icon="📜" count={deckStats.spell ?? 0} color="text-indigo-400" />
                {(deckStats.skull ?? 0) > 0 && <DeckStatItem icon="💀" count={deckStats.skull ?? 0} color="text-stone-500" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


