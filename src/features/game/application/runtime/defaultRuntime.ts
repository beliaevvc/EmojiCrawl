/**
 * Default runtime implementations for domain ports (Rng / Clock).
 *
 * Слой: Application (runtime defaults).
 *
 * Важно:
 * - Domain импортирует только типы портов и НЕ использует глобальные `Math/Date` напрямую.
 * - Здесь (внешний слой) мы даём дефолтные реализации поверх `Math.random/Date.now`.
 * - Composition root (`src/app/...`) может заменить эти реализации на seeded/recordable варианты позже.
 */
import type { Clock } from '@/features/game/domain/ports/Clock';
import type { Rng } from '@/features/game/domain/ports/Rng';

export const defaultRng: Rng = {
  nextFloat: () => Math.random(),
};

export const defaultClock: Clock = {
  now: () => Date.now(),
};


