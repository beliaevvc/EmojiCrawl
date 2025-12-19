/**
 * PlayerAvatar — аватар героя в центре доски боя.
 *
 * Контекст (Блок 3.5): вынос из `GameScreen/GameBoard` в отдельный компонент.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - отображает HP (в т.ч. анимированный `visualHp`) и максимальный HP,
 * - показывает визуальные эффекты (тряска/подсветки/пульс),
 * - отображает 💎 и активные баффы,
 * - даёт drop-zone для взаимодействия “на героя”.
 *
 * Входы:
 * - refs/колбэки drop,
 * - визуальные значения и флаги эффектов (`heroShake/armorFlash/...`).
 *
 * Инварианты:
 * - это чистый UI: логика боевых правил/применения предметов живёт в контроллере/хуках.
 *
 * Блок 4 (Content Layer):
 * - иконки “активных баффов” (заклинаний) берём из `baseGameContent.spellsById`,
 * - UI не импортит `src/data/spells.ts`, чтобы дальше можно было переключать content packs.
 */

import type { RefObject } from 'react';
import { ItemTypes } from '@/types/DragTypes';
import { baseGameContent } from '@/features/game/application/gameContent';
import { InteractionZone } from '../dnd/InteractionZone';

export function PlayerAvatar({
  heroRef,
  onDropToPlayer,
  visualHp,
  maxHp,
  heroShake,
  armorFlash,
  healFlash,
  coinPulse,
  coins,
  activeBuffs,
  hasMissEffect,
}: {
  heroRef: RefObject<HTMLDivElement>;
  onDropToPlayer: (item: any) => void;
  visualHp: number;
  maxHp: number;
  heroShake: boolean;
  armorFlash: boolean;
  healFlash: boolean;
  coinPulse: boolean;
  coins: number;
  activeBuffs: string[];
  hasMissEffect: boolean;
}) {
  return (
    <InteractionZone onDrop={onDropToPlayer} accepts={[ItemTypes.CARD]} className="relative aspect-square">
      <div
        ref={heroRef}
        className={`w-full h-full rounded-full border-2 md:border-4 border-stone-400 bg-stone-800 flex items-center justify-center text-4xl md:text-6xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden transition-all ${heroShake ? 'animate-shake ring-4 ring-rose-500' : ''} ${armorFlash ? 'ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)] brightness-110 scale-105' : ''} ${healFlash ? 'ring-4 ring-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.6)] brightness-110 scale-105' : ''}`}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rose-900/50 to-transparent transition-all duration-500"
          style={{ height: `${(visualHp / maxHp) * 100}%` }}
        />
        🧙‍♂️
      </div>

      {/* Active Buffs Icons */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center z-30 pointer-events-none">
        {activeBuffs.map((effect, i) => {
          const spell = baseGameContent.spellsById[effect];
          return spell ? (
            <div
              key={`${effect}-${i}`}
              className="w-5 h-5 md:w-6 md:h-6 bg-indigo-900/80 border border-indigo-400/50 rounded-full flex items-center justify-center text-[10px] md:text-xs shadow-sm backdrop-blur-[1px]"
            >
              {spell.icon}
            </div>
          ) : null;
        })}
      </div>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 bg-green-900 border-2 border-green-500 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-green-100 z-20 shadow-md">
        {visualHp}
      </div>

      {/* Right Side Status Icons (Coins + Debuffs) */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center z-30 pointer-events-none">
        <div
          className={`w-5 h-5 md:w-6 md:h-6 bg-stone-700 border border-stone-500 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-stone-300 shadow-md transition-all duration-300 ${coinPulse ? 'scale-125 ring-2 ring-amber-400 bg-amber-900/50' : ''}`}
        >
          {coins}
        </div>
        {hasMissEffect && (
          <div
            className="w-5 h-5 md:w-6 md:h-6 bg-stone-900/90 border border-stone-500 rounded-full flex items-center justify-center text-[10px] shadow-md animate-pulse"
            title="Промах: -2 к атаке"
          >
            💫
          </div>
        )}
      </div>
    </InteractionZone>
  );
}


