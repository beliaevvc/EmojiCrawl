/**
 * useLatestRef
 *
 * UI-слой (React). Небольшой хелпер для хранения "последнего значения" в ref,
 * чтобы колбэки (DnD/таймеры/эффекты) могли читать актуальные данные без проблем со stale-closure.
 *
 * Вынесено из `GameScreen` в рамках Блока 3 как общий паттерн.
 */
import { useRef } from 'react';

export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}


