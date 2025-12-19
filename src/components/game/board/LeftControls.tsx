/**
 * LeftControls — левая панель управления боем (проклятие + сброс руки).
 *
 * Контекст (Блок 3.5): вынос из `GameScreen` в отдельную UI-часть layout.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - отображает `CurseSlot` (выбор/отображение проклятия),
 * - показывает кнопку сброса руки (-5 HP) в соответствии с флагами `canReset`.
 *
 * Входы:
 * - `curse/isCurseLocked/canOpenCursePicker` + `onOpenCursePicker`,
 * - `canReset` + `onReset`.
 *
 * Инварианты:
 * - не знает про reducer/dispatch (всё прокидывается колбэками),
 * - поведение 1:1 со старым layout в `GameScreen`.
 */

import { CurseSlot } from '@/components/CurseSlot';
import type { CurseType } from '@/types/game';

export function LeftControls({
  curse,
  isCurseLocked,
  canOpenCursePicker,
  onOpenCursePicker,
  canReset,
  onReset,
}: {
  curse: CurseType | null;
  isCurseLocked: boolean;
  canOpenCursePicker: boolean;
  onOpenCursePicker: () => void;
  canReset: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-row items-center justify-end gap-2 md:gap-4 min-w-[6rem] md:min-w-[8rem]">
      <div className="z-20">
        <CurseSlot
          curse={curse}
          isLocked={isCurseLocked}
          onClick={() => {
            if (canOpenCursePicker) onOpenCursePicker();
          }}
        />
      </div>

      <button
        className={`group flex flex-col items-center gap-1 active:scale-95 transition-transform scale-75 md:scale-100 ${!canReset ? 'opacity-50 pointer-events-none grayscale' : ''}`}
        onClick={onReset}
      >
        <div className="relative">
          <div className="w-14 h-16 bg-stone-800/80 border border-stone-600 rounded-b-3xl rounded-t-sm flex items-center justify-center text-3xl group-hover:bg-stone-700 transition-colors shadow-lg">
            🛡️
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
            <div className="w-0.5 h-full bg-stone-950 rotate-12"></div>
          </div>
        </div>
        <span className="text-xs font-bold tracking-widest text-stone-400 group-hover:text-stone-200 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm uppercase">
          Сброс (-5HP)
        </span>
      </button>
    </div>
  );
}


