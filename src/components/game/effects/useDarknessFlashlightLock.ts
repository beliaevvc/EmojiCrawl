/**
 * useDarknessFlashlightLock — блокировка пасхалки Lumos/Nox при проклятии “Тьма”.
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы правила блокировки были отдельно.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - включает глобальный lock фонарика, когда активна `darkness`,
 * - гарантированно снимает lock при смене проклятия/размонтаже.
 *
 * Инварианты:
 * - поведение 1:1 со старым useEffect,
 * - это “инфраструктурный” UI-эффект (глобальная настройка), не доменная механика.
 */
import { useEffect } from 'react';
import { setFlashlightLocked } from '@/utils/flashlightLock';
import type { CurseType } from '@/types/game';

export function useDarknessFlashlightLock(curse: CurseType | null) {
  useEffect(() => {
    const locked = curse === 'darkness';
    setFlashlightLocked(locked);

    return () => {
      // Гарантируем снятие lock при размонтировании (и при смене проклятия).
      setFlashlightLocked(false);
    };
  }, [curse]);
}


