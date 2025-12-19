/**
 * HUD Window: GameLogWindow
 *
 * Контекст (Блок 3): вынесено из `GameScreen` в `windows/`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - показывает последние логи боя (combat/info/gain/spell/…),
 * - поддерживает expand/collapse (сворачиваемый список),
 * - поддерживает drag-позиционирование окна (через `WindowPosition`).
 *
 * Входы:
 * - `logs` — массив логов из `GameState`,
 * - `position/onPositionChange` — сохранённая позиция окна (обычно из `useHudWindowPositions`).
 *
 * Инварианты:
 * - не содержит игровой логики,
 * - поведение 1:1 со старым `GameScreen` (только перенос).
 */

import { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LogEntry } from '@/types/game';
import type { WindowPosition } from '@/utils/uiStorage';

export function GameLogWindow({
  logs,
  position,
  onPositionChange,
}: {
  logs: LogEntry[];
  position?: WindowPosition;
  onPositionChange?: (pos: WindowPosition) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dragControls = useDragControls();
  const x = position?.x || 0;
  const y = position?.y || 0;

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      onDragEnd={(_, info) => onPositionChange && onPositionChange({ x: x + info.offset.x, y: y + info.offset.y })}
      initial={{ opacity: 0, y: y + 20, x, height: '8rem' }}
      animate={{ opacity: 1, y, x, height: expanded ? '60vh' : '8rem' }}
      exit={{ opacity: 0, y: y + 20, x, height: '8rem' }}
      transition={{ duration: 0.3 }}
      className={`
        absolute bottom-24 right-4 z-40
        bg-stone-900/80 backdrop-blur-md border border-stone-700
        rounded-xl shadow-2xl flex flex-col overflow-hidden
        w-64 md:w-80
      `}
    >
      <div
        className="flex items-center justify-between p-2 bg-stone-800/50 border-b border-stone-700 cursor-move hover:bg-stone-800 transition-colors select-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-2 pointer-events-none">Журнал</span>
        <div
          className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors z-50"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown size={16} className="text-stone-400" />
          ) : (
            <ChevronUp size={16} className="text-stone-400" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar flex flex-col-reverse cursor-default">
        {logs.map((log) => {
          let color = 'text-stone-400';
          if (log.type === 'combat') color = 'text-rose-400';
          if (log.type === 'heal') color = 'text-emerald-400';
          if (log.type === 'gain') color = 'text-amber-400';
          if (log.type === 'spell') color = 'text-indigo-400';

          return (
            <div
              key={log.id}
              className={`text-[10px] md:text-xs ${color} font-medium leading-tight border-b border-stone-800/50 pb-1 last:border-0`}
            >
              {log.message}
            </div>
          );
        })}
        {logs.length === 0 && <div className="text-center text-stone-600 text-xs py-4">Нет записей...</div>}
      </div>
    </motion.div>
  );
}


