/**
 * useSilenceBlockedFx — floating text при блокировке магии (“МОЛЧАНИЕ”).
 *
 * Контекст (Блок 3, effects): вынесено из `GameScreen`, чтобы эффект был отдельным.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - реагирует на последний лог и, если там “МОЛЧАНИЕ: Магия заблокирована”,
 *   показывает floating text в районе верхней линии слотов врагов.
 *
 * Инварианты:
 * - эффект визуальный, state игры не меняет,
 * - координаты берутся из `slotRefs` (если доступны) либо из fallback по окну.
 */

import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { LogEntry } from '@/types/game';

export function useSilenceBlockedFx({
  logs,
  slotRefs,
  addFloatingText,
}: {
  logs: LogEntry[];
  slotRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  addFloatingText: (x: number, y: number, text: string, color: string, centered?: boolean, scale?: number) => void;
}) {
  useEffect(() => {
    const lastLog = logs[0];
    if (lastLog && lastLog.message.includes('МОЛЧАНИЕ: Магия заблокирована')) {
      let x = window.innerWidth / 2;
      let y = window.innerHeight * 0.25;

      if (slotRefs.current[0] && slotRefs.current[3]) {
        const r1 = slotRefs.current[0].getBoundingClientRect();
        const r2 = slotRefs.current[3].getBoundingClientRect();
        x = (r1.left + r2.right) / 2;
        y = r1.top - 30;
      }

      addFloatingText(
        x,
        y,
        '🚫 МАГИЯ ЗАБЛОКИРОВАНА',
        'text-rose-400 font-bold text-xs md:text-sm drop-shadow-md bg-stone-900/95 px-3 py-1.5 rounded-lg border border-rose-500/40 backdrop-blur-md z-[100] tracking-wider',
        true
      );
    }
  }, [logs, slotRefs, addFloatingText]);
}


