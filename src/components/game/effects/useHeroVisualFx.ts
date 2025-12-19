/**
 * useHeroVisualFx — визуальные эффекты героя (HP/💎/блок/благословение).
 *
 * Контекст (Блок 3.3): вынесено из `GameScreen`, чтобы эффекты жили отдельно от экрана.
 *
 * Слой: UI (React). Это не домен — только визуал/анимации.
 *
 * Входы:
 * - `hp`, `coins`, `logs`,
 * - `addFloatingText` — внешний контроллер overlay floating texts.
 *
 * Выход:
 * - `heroRef` (DOM ref для позиционирования),
 * - флаги анимаций (`heroShake/coinPulse/armorFlash/healFlash`).
 *
 * Инварианты:
 * - поведение 1:1 со старым `GameScreen`,
 * - эффекты триггерятся на изменение значений/логов, но не меняют game state.
 *
 * Примечание:
 * - логика “Blessing” и “Armor blocked” сохранена как была (по логам).
 */

import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/types/game';

export function useHeroVisualFx({
  hp,
  coins,
  logs,
  addFloatingText,
}: {
  hp: number;
  coins: number;
  logs: LogEntry[];
  addFloatingText: (x: number, y: number, text: string, color: string, centered?: boolean, scale?: number) => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);

  const prevHeroHp = useRef(hp);
  const prevCoinsRef = useRef(coins);

  const [heroShake, setHeroShake] = useState(false);
  const [coinPulse, setCoinPulse] = useState(false);

  const [armorFlash, setArmorFlash] = useState(false);
  const [healFlash, setHealFlash] = useState(false);
  const lastBlessingId = useRef<string | null>(null);

  // HP -> floating text + “дрожь” аватара при уроне
  useEffect(() => {
    const diff = hp - prevHeroHp.current;
    if (diff !== 0 && heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      if (diff < 0) {
        addFloatingText(x, y, `${diff}`, 'text-rose-500', true);
        setHeroShake(true);
        setTimeout(() => setHeroShake(false), 300);
      } else {
        // Хил: если это “Благословение”, то плавающий текст рисуем отдельным эффектом ниже (с задержкой).
        const recentLogs = logs.slice(0, 3);
        const isBlessing = recentLogs.some((l) => l.message.includes('БЛАГОСЛОВЕНИЕ'));
        if (!isBlessing) {
          addFloatingText(x, y, `+${diff}`, 'text-emerald-400', true);
        }
      }
    }
    prevHeroHp.current = hp;
  }, [hp, logs, addFloatingText]);

  // 💎 -> floating text + “пульс” при получении
  useEffect(() => {
    const diff = coins - prevCoinsRef.current;
    if (diff !== 0 && heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      const x = rect.right;
      const y = rect.top + rect.height / 2 - 15;

      if (diff > 0) {
        addFloatingText(x, y, `+${diff} 💎`, 'text-amber-400');
        setCoinPulse(true);
        setTimeout(() => setCoinPulse(false), 300);
      } else if (diff < 0) {
        addFloatingText(x, y, `${diff} 💎`, 'text-rose-500');
      }
    }
    prevCoinsRef.current = coins;
  }, [coins, addFloatingText]);

  // “Доспехи заблокировали”: короткая вспышка + подпись (по последнему логу)
  useEffect(() => {
    const lastLog = logs[0];
    if (lastLog && lastLog.message.includes('Доспехи заблокировали')) {
      setArmorFlash(true);
      setTimeout(() => setArmorFlash(false), 400);

      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        addFloatingText(x, y, '🛡️ БЛОК', 'text-yellow-300 font-bold text-lg drop-shadow-md', true);
      }
    }
  }, [logs, addFloatingText]);

  // “Благословение”: отложенный хил (триггерим по логам, как было раньше)
  useEffect(() => {
    const blessingLog = logs.slice(0, 3).find((l) => l.message.includes('БЛАГОСЛОВЕНИЕ'));
    if (blessingLog && blessingLog.id !== lastBlessingId.current) {
      lastBlessingId.current = blessingLog.id;

      const timer = setTimeout(() => {
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top;
          addFloatingText(x, y, '+2', 'text-emerald-400', true);
          setHealFlash(true);
          setTimeout(() => setHealFlash(false), 500);
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [logs, addFloatingText]);

  return { heroRef, heroShake, coinPulse, armorFlash, healFlash };
}


