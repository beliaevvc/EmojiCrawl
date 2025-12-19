/**
 * GameBottomBar — нижняя HUD-панель управления.
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - основные кнопки: New Game / Pause (если доступно) / Rules / Info,
 * - дополнительные инструменты в режиме Info: настройки HUD, сброс окон, панель “читов” (God Mode).
 *
 * Входы:
 * - callbacks открытия модалок/переключений (`onOpenRules`, `onOpenRestartConfirm`, ...),
 * - `showInfo` и `onToggleInfo`,
 * - `isGodMode` и `onToggleGodMode`.
 *
 * Инварианты:
 * - не содержит механики: только UI-события,
 * - локальные UI-состояния (hover/toggle) живут здесь, чтобы не раздувать `GameScreen`.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Crown, Eye, EyeOff, Flag, Pause, RotateCcw, Search, Settings } from 'lucide-react';
import { SystemButton } from '@/components/game/hud/SystemButton';

export function GameBottomBar({
  showInfo,
  onToggleInfo,
  onOpenHUDSettings,
  onResetLayout,

  onOpenRestartConfirm,
  onOpenRules,
  onOpenPause,

  isGodMode,
  onToggleGodMode,
}: {
  showInfo: boolean;
  onToggleInfo: () => void;
  onOpenHUDSettings: () => void;
  onResetLayout: () => void;

  onOpenRestartConfirm: () => void;
  onOpenRules: () => void;
  onOpenPause?: () => void;

  isGodMode: boolean;
  onToggleGodMode: () => void;
}) {
  const [isResetHovered, setIsResetHovered] = useState(false);
  const [showGodModeToggle, setShowGodModeToggle] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 flex gap-3 md:gap-6 items-end justify-start z-20 w-full px-4 md:px-6 pb-6 md:pb-8 min-h-[3.5rem] pointer-events-auto">
      <SystemButton icon={<Flag size={20} />} label="New Game" onClick={onOpenRestartConfirm} danger={true} />

      {onOpenPause && (
        <SystemButton icon={<Pause size={20} />} label="Пауза" onClick={onOpenPause} />
      )}

      <SystemButton icon={<BookOpen size={20} />} label="Правила" onClick={onOpenRules} />

      <SystemButton icon={<Search size={20} />} label="Info" active={showInfo} onClick={onToggleInfo} />

      <AnimatePresence>
        {showInfo && (
          <>
            <motion.button
              key="hud-settings"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={onOpenHUDSettings}
              className="flex items-center justify-center p-3 text-stone-600/40 hover:text-stone-300 transition-all ml-1"
              title="Настройки интерфейса"
            >
              <Settings size={18} />
            </motion.button>

            <motion.button
              key="reset-layout"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={onResetLayout}
              onMouseEnter={() => setIsResetHovered(true)}
              onMouseLeave={() => setIsResetHovered(false)}
              className="relative flex items-center justify-center p-3 text-stone-600/40 hover:text-stone-300 transition-all ml-1"
            >
              <RotateCcw size={18} />
              <AnimatePresence>
                {isResetHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-stone-800 border border-stone-600 text-stone-200 text-[10px] rounded shadow-lg whitespace-nowrap pointer-events-none z-50"
                  >
                    Сбросить окна
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              key="god-mode-toggle"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={() => setShowGodModeToggle(!showGodModeToggle)}
              className="flex items-center justify-center p-3 text-stone-600/40 hover:text-stone-300 transition-all ml-1"
              title={showGodModeToggle ? 'Скрыть читы' : 'Показать читы'}
            >
              {showGodModeToggle ? <EyeOff size={20} /> : <Eye size={20} />}
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfo && showGodModeToggle && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: -10 }}
            animate={{ width: 'auto', opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="overflow-hidden ml-2 flex-shrink-0 flex items-end"
          >
            <div className="px-1 pt-2 pb-0">
              <button
                onClick={onToggleGodMode}
                className={`
                  group flex items-center gap-3 px-5 py-3 
                  backdrop-blur-md border 
                  rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 
                  transition-all duration-200 whitespace-nowrap
                  ${
                    isGodMode
                      ? 'bg-yellow-500/90 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                      : 'bg-stone-900/80 border-stone-700 hover:border-yellow-500/50'
                  }
                `}
              >
                <div
                  className={`
                    ${isGodMode ? 'text-stone-900' : 'text-stone-400 group-hover:text-yellow-400'}
                    transition-colors
                  `}
                >
                  <Crown size={20} fill={isGodMode ? 'currentColor' : 'none'} />
                </div>
                <span
                  className={`
                    text-[10px] md:text-xs font-bold tracking-widest uppercase
                    ${isGodMode ? 'text-stone-900' : 'text-stone-500 group-hover:text-yellow-200'}
                    transition-colors
                  `}
                >
                  {isGodMode ? 'GOD ON' : 'God Mode'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


