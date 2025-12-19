/**
 * HUD Window: CardsViewer
 *
 * Контекст (Блок 3): вынесено из `GameScreen` в `windows/`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - показывает список “мини-карт” колоды или сброса,
 * - поддерживает переключение страниц/скролл (внутренний контрол зависит от реализации),
 * - поддерживает drag-позиционирование окна,
 * - может показывать статистику типов карт (если `stats` переданы).
 *
 * Входы:
 * - `cards` — массив карт (deck или discard),
 * - `label` — заголовок окна (“Колода/Сброс”),
 * - `position/onPositionChange` — сохранение положения окна,
 * - `stats` — опциональный блок breakdown по типам.
 *
 * Инварианты:
 * - чистый UI: не меняет game state, только отображает,
 * - поведение должно совпадать с предыдущей реализацией в `GameScreen` (перенос 1:1).
 *
 * Примечание:
 * - Это окно намеренно “самодостаточно”: внутренняя пагинация/hover-детали живут здесь,
 *   чтобы `GameScreen` не разрастался.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Card } from '@/types/game';
import type { WindowPosition } from '@/utils/uiStorage';
import { DeckStatItem } from '@/components/game/hud/DeckStatItem';

function MiniCard({ card }: { card: Card }) {
  const [hover, setHover] = useState(false);

  let borderColor = 'border-stone-700';
  let bgColor = 'bg-stone-900';

  if (card.type === 'monster') {
    borderColor = 'border-rose-900/40';
    bgColor = 'bg-rose-950/20';
  }
  if (card.type === 'shield') {
    borderColor = 'border-blue-900/40';
    bgColor = 'bg-blue-950/20';
  }
  if (card.type === 'weapon') {
    borderColor = 'border-stone-600';
    bgColor = 'bg-stone-800/50';
  }
  if (card.type === 'potion') {
    borderColor = 'border-emerald-900/40';
    bgColor = 'bg-emerald-950/20';
  }
  if (card.type === 'coin') {
    borderColor = 'border-amber-900/40';
    bgColor = 'bg-amber-950/20';
  }
  if (card.type === 'spell') {
    borderColor = 'border-indigo-900/40';
    bgColor = 'bg-indigo-950/20';
  }

  return (
    <motion.div
      className={`
        relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center 
        border-2 ${borderColor} ${bgColor} 
        cursor-help group flex-shrink-0 transition-all hover:scale-110 hover:z-30 hover:shadow-lg hover:border-opacity-100
      `}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <span className="text-base md:text-xl drop-shadow-md">{card.icon}</span>
      {card.value > 0 && (
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black/60 border border-stone-600 flex items-center justify-center text-[8px] md:text-[9px] font-bold text-stone-300 font-mono">
          {card.value}
        </span>
      )}

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-40 md:w-48 bg-stone-900/95 backdrop-blur-xl border border-stone-600 rounded-xl p-3 shadow-2xl z-[100] pointer-events-none"
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-stone-600"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 bg-black/30 border border-white/10 shadow-inner relative">
                {card.icon}
                {card.label && card.type === 'monster' && (
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 rounded-full border border-stone-900 shadow-sm"
                    style={{
                      backgroundColor:
                        card.label === 'ordinary'
                          ? '#10b981'
                          : card.label === 'tank'
                          ? '#eab308'
                          : card.label === 'medium'
                          ? '#f97316'
                          : card.label === 'mini-boss'
                          ? '#a855f7'
                          : card.label === 'boss'
                          ? '#e11d48'
                          : 'transparent',
                    }}
                  />
                )}
              </div>
              <div className="font-bold text-stone-200 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                {card.name || card.type}
              </div>
              {card.value > 0 && <div className="font-mono text-xl font-bold text-stone-100 mb-1">{card.value}</div>}
              {card.description && (
                <div className="text-[10px] text-stone-400 leading-tight border-t border-white/10 pt-2 w-full">
                  {card.description}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Card Label Indicator */}
      {card.label && card.type === 'monster' && (
        <div
          className="absolute -top-0.5 left-0 w-2.5 h-2.5 rounded-full border border-stone-900 shadow-sm z-20"
          style={{
            backgroundColor:
              card.label === 'ordinary'
                ? '#10b981'
                : card.label === 'tank'
                ? '#eab308'
                : card.label === 'medium'
                ? '#f97316'
                : card.label === 'mini-boss'
                ? '#a855f7'
                : card.label === 'boss'
                ? '#e11d48'
                : 'transparent',
          }}
        />
      )}
    </motion.div>
  );
}

export function CardsViewer({
  cards,
  label,
  className = 'top-40',
  position,
  onPositionChange,
  stats,
}: {
  cards: Card[];
  label: string;
  className?: string;
  position?: WindowPosition;
  onPositionChange?: (pos: WindowPosition) => void;
  stats?: Record<string, number>;
}) {
  const [offset, setOffset] = useState(0);
  const visibleCount = 8;

  // Показываем “верх” стопки первым: [последняя добавленная, ..., самая ранняя]
  const displayCards = [...cards].reverse();

  const maxOffset = Math.max(0, displayCards.length - visibleCount);
  const currentOffset = Math.min(offset, maxOffset);

  const visibleCardsSlice = displayCards.slice(currentOffset, currentOffset + visibleCount);

  const canGoLeft = currentOffset > 0;
  const canGoRight = currentOffset < maxOffset;

  const handleLeft = () => setOffset(Math.max(0, currentOffset - 1));
  const handleRight = () => setOffset(Math.min(maxOffset, currentOffset + 1));

  if (displayCards.length === 0 && label !== 'Сброс') return null;

  const x = position?.x || 0;
  const y = position?.y || 0;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (onPositionChange) {
          onPositionChange({ x: x + info.offset.x, y: y + info.offset.y });
        }
      }}
      initial={{ opacity: 0, y: label === 'Сброс' ? y + 20 : y - 20, x }}
      animate={{ opacity: 1, y, x }}
      exit={{ opacity: 0, y: label === 'Сброс' ? y + 20 : y - 20, x }}
      className={`absolute left-0 right-0 mx-auto w-fit z-20 flex flex-col items-center justify-center gap-2 overflow-visible cursor-move active:cursor-grabbing ${className}`}
    >
      <div className="flex items-center justify-center gap-2">
        <button
          disabled={!canGoLeft}
          onClick={handleLeft}
          className={`p-1 rounded-full transition-colors ${
            canGoLeft ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-800'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1 md:gap-2 px-2 py-2 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner min-h-[4.5rem] min-w-[3rem] justify-center">
          <AnimatePresence mode="popLayout">
            {visibleCardsSlice.map((card, i) => (
              <MiniCard key={card.id || i} card={card} />
            ))}
          </AnimatePresence>
          {visibleCardsSlice.length === 0 && <span className="text-xs text-stone-600 self-center px-4">Пусто</span>}
        </div>

        <button
          disabled={!canGoRight}
          onClick={handleRight}
          className={`p-1 rounded-full transition-colors ${
            canGoRight ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-800'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {stats && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-900/90 border border-stone-700 rounded-lg shadow-lg backdrop-blur-sm mt-1">
          <div className="flex items-center gap-2 border-r border-stone-700 pr-3 mr-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Всего</span>
            <span className="font-mono font-bold text-stone-200 text-sm">{cards.length}</span>
          </div>
          <div className="flex gap-1">
            <DeckStatItem icon="🐺" count={stats.monster} color="text-rose-400" />
            <DeckStatItem icon="💎" count={stats.coin} color="text-amber-400" />
            <DeckStatItem icon="🧪" count={stats.potion} color="text-emerald-400" />
            <DeckStatItem icon="🛡️" count={stats.shield} color="text-stone-300" />
            <DeckStatItem icon="⚔️" count={stats.weapon} color="text-stone-300" />
            <DeckStatItem icon="📜" count={stats.spell} color="text-indigo-400" />
            {stats.skull > 0 && <DeckStatItem icon="💀" count={stats.skull} color="text-stone-500" />}
          </div>
        </div>
      )}

      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-stone-600 bg-stone-950 px-2 rounded-full border border-stone-800 whitespace-nowrap">
        {label} ({displayCards.length > 0 ? currentOffset + 1 : 0}-
        {Math.min(displayCards.length, currentOffset + visibleCount)})
      </div>
    </motion.div>
  );
}


