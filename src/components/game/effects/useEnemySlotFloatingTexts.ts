/**
 * useEnemySlotFloatingTexts — floating texts для слотов врагов (урон/хил/свапы/смерть).
 *
 * Контекст (Блок 3, effects): вынесено из `GameScreen` как отдельная подсистема визуальных эффектов.
 *
 * Слой: UI (React). Только визуал.
 *
 * Что делает:
 * - отслеживает изменения `enemySlots` в связке с последними логами,
 * - спавнит floating texts над конкретным слотом:
 * - урон/хил,
 * - swap/mirror значения,
 * - “убежал” (flee),
 * - “воскрес” (graveyard),
 * - “💀” для junk/bones при смерти.
 *
 * Входы:
 * - `enemySlots`, `logs`, `slotRefs`, `addFloatingText`.
 *
 * Инварианты:
 * - это чисто визуальный эффект, не меняет state игры,
 * - опирается на `slotRefs` для координат (поведение 1:1).
 */

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Card, LogEntry } from '@/types/game';

export function useEnemySlotFloatingTexts({
  enemySlots,
  logs,
  slotRefs,
  addFloatingText,
}: {
  enemySlots: Array<Card | null>;
  logs: LogEntry[];
  slotRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  addFloatingText: (x: number, y: number, text: string, color: string, centered?: boolean, scale?: number) => void;
}) {
  const prevEnemySlots = useRef<Array<Card | null>>(enemySlots);

  useEffect(() => {
    const lastLog = logs[0];
    const isSwap = !!lastLog && lastLog.message.includes('ЗАМЕНА');
    const isMirror = !!lastLog && lastLog.message.includes('ЗЕРКАЛО');
    const isGraveyard = !!lastLog && lastLog.message.includes('КЛАДБИЩЕ');

    enemySlots.forEach((card, i) => {
      const prevCard = prevEnemySlots.current[i];
      const slotEl = slotRefs.current[i];

      if (!slotEl) return;

      let diff = 0;
      let hasChanged = false;
      let newValue = 0;

      /**
       * “КЛАДБИЩЕ” — это сценарий, когда в слот внезапно появляется новый монстр.
       * Мы показываем отдельный текст “ВОСКРЕС!” именно на появлении нового id в слоте,
       * чтобы не путать это с обычным “хилом/уроном”.
       */
      const isNewCard = !!card && (!prevCard || prevCard.id !== card.id);
      if (isNewCard && isGraveyard) {
        const rect = slotEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        addFloatingText(x, y, '👻 ВОСКРЕС!', 'text-purple-400 font-bold text-lg drop-shadow-md tracking-wider', true);
      }

      if (prevCard && prevCard.type === 'monster') {
        let isFlee = false;

        /**
         * Кейс 1: монстр остался тем же (id совпадает), но изменилось HP (value).
         * Визуально показываем урон/хил по разнице.
         */
        if (card && card.type === 'monster' && card.id === prevCard.id) {
          diff = prevCard.value - card.value;
          newValue = card.value;
          if (diff !== 0) hasChanged = true;
        }
        /**
         * Кейс 2: монстр исчез из слота.
         * Это может быть:
         * - смерть от урона,
         * - “убежал” (flee) — тоже исчез, но с особым логом,
         * - недамажные удаления (“ветер/побег/сброс”) — там урон не показываем.
         *
         * Отличаем по последним логам (поведение исторически такое же, как в `GameScreen`).
         */
        else if (!card) {
          const recentLogs = logs.slice(0, 3);

          // “БЕГСТВО”: показываем только урон, который монстр “получил перед уходом”, плюс подпись “УБЕЖАЛ”.
          const fleeLog = recentLogs.find((log) => log.message.includes('БЕГСТВО'));

          if (fleeLog) {
            const match = fleeLog.message.match(/получил урон (\d+)/);
            if (match) {
              diff = parseInt(match[1]);
              hasChanged = true;
              isFlee = true;
            }
          } else {
            const isNonDamageRemoval = recentLogs.some(
              (log) =>
                log.message.includes('ВЕТЕР') ||
                log.message.includes('ПОБЕГ') ||
                log.message.includes('СБРОС')
            );

            if (!isNonDamageRemoval) {
              diff = prevCard.value;
              hasChanged = true;
            }
          }
        }

        if (hasChanged) {
          const rect = slotEl.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top;

          if (isSwap && card) {
            addFloatingText(x, y, `🔄 ${newValue}`, 'text-indigo-400 font-bold text-xl drop-shadow-black', true);
          } else if (isMirror && card) {
            addFloatingText(x, y, `⚙️ ${newValue}`, 'text-cyan-400 font-bold text-xl drop-shadow-black', true);
          } else if (diff > 0) {
            // Урон (diff > 0, потому что считаем prev.value - new.value)
            addFloatingText(x, y, `-${diff}`, 'text-rose-500', true);
            if (isFlee) {
              setTimeout(() => {
                addFloatingText(
                  x,
                  y + 30,
                  '💨 УБЕЖАЛ',
                  'text-stone-400 font-bold text-[10px] tracking-widest uppercase drop-shadow-md',
                  true,
                  1.0
                );
              }, 200);
            }
          } else if (diff < 0) {
            // Хил (diff < 0 => значение стало больше)
            addFloatingText(x, y, `+${Math.abs(diff)}`, 'text-emerald-400', true);
          }

          /**
           * Визуальный “посмертный” эффект для junk/bones (череп появляется уже после смерти).
           * Тут именно UI-фидбек, логика появления черепа живёт в reducer/domain.
           */
          if (!card && prevCard && (prevCard.ability === 'junk' || prevCard.ability === 'bones')) {
            setTimeout(() => {
              addFloatingText(x, y - 20, '💀', 'text-2xl drop-shadow-md animate-pulse', true, 1.0);
            }, 150);
          }
        }
      }
    });

    prevEnemySlots.current = enemySlots;
  }, [enemySlots, logs, slotRefs, addFloatingText]);
}


