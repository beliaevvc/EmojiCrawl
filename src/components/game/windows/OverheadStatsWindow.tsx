/**
 * HUD Window: OverheadStatsWindow
 *
 * Контекст (Блок 3): вынесено из `GameScreen` в `windows/`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - показывает “оверстаты” текущего забега:
 *   - `overheal` (лишнее лечение),
 *   - `overdamage/overkill` (лишний урон),
 *   - `overdef` (лишняя защита),
 * - поддерживает drag-позиционирование окна.
 *
 * Входы:
 * - `overheads` — значения из `GameState`,
 * - `position/onPositionChange` — сохранённая позиция окна.
 *
 * Инварианты:
 * - чистый UI: не вычисляет/не изменяет оверстаты, только отображает,
 * - поведение 1:1 со старым экраном.
 */

import { motion } from 'framer-motion';
import { Activity, Zap, Swords, Shield } from 'lucide-react';
import type { Overheads } from '@/types/game';
import type { WindowPosition } from '@/utils/uiStorage';

export function OverheadStatsWindow({
  overheads,
  position,
  onPositionChange,
}: {
  overheads: Overheads;
  position?: WindowPosition;
  onPositionChange?: (pos: WindowPosition) => void;
}) {
  const x = position?.x || 0;
  const y = position?.y || 0;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => onPositionChange && onPositionChange({ x: x + info.offset.x, y: y + info.offset.y })}
      initial={{ opacity: 0, x: x + 20, y }}
      animate={{ opacity: 1, x, y }}
      exit={{ opacity: 0, x: x + 20, y }}
      className="absolute top-24 right-4 z-30 bg-stone-900/80 backdrop-blur-md border border-stone-700 rounded-xl p-3 shadow-xl w-48 select-none cursor-move active:cursor-grabbing"
    >
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 border-b border-stone-800 pb-1 flex items-center gap-2">
        <Activity size={12} /> Аналитика
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-emerald-400/80 flex items-center gap-1.5">
            <Zap size={12} /> Overheal
          </span>
          <span className="font-mono font-bold text-emerald-200">{overheads.overheal}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-rose-400/80 flex items-center gap-1.5">
            <Swords size={12} /> Overkill
          </span>
          <span className="font-mono font-bold text-rose-200">{overheads.overdamage}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-blue-400/80 flex items-center gap-1.5">
            <Shield size={12} /> Overdef
          </span>
          <span className="font-mono font-bold text-blue-200">{overheads.overdef}</span>
        </div>
      </div>
    </motion.div>
  );
}


