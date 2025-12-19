/**
 * OverlaysPlugin — глобальные визуальные оверлеи приложения (Блок 6).
 *
 * Слой: App / Framework (UI plugins).
 *
 * ## Что это
 * “Плагин” внешнего слоя UI: набор визуальных эффектов, которые рендерятся поверх всех экранов.
 *
 * ## Зачем
 * Эти оверлеи исторически подключались прямо в `App.tsx`, из‑за чего он разрастался.
 * В Блоке 6 мы выносим их в отдельный модуль, чтобы:
 * - держать `App.tsx` тонким,
 * - уметь отключать оверлеи целиком (см. `appConfig` → `VITE_OVERLAYS_ENABLED=false`),
 * - не размазывать “глобальные эффекты” по отдельным экранам.
 *
 * ## Что делает
 * Просто рендерит набор глобальных оверлеев:
 * - `GhostTrailOverlay`
 * - `FlashlightOverlay` (пасхалка Lumos/Nox; может быть заблокирована проклятием “Тьма”)
 * - `SlimeOverlay`
 *
 * ## Инварианты / правила
 * - Никакой доменной логики и состояния игры — только визуальные глобальные слои.
 * - Оверлеи должны быть `pointer-events-none` или корректно вести себя так, чтобы не ломать DnD.
 * - Этот компонент должен быть безопасен к отключению.
 *
 * Держим здесь "поверх всего" эффекты, которые не должны размазываться по `App.tsx`.
 * Поведение 1:1 с прежним подключением оверлеев в `App.tsx`.
 */
import { FlashlightOverlay } from '@/components/FlashlightOverlay';
import { GhostTrailOverlay } from '@/components/GhostTrailOverlay';
import { SlimeOverlay } from '@/components/SlimeOverlay';

export function OverlaysPlugin() {
  return (
    <>
      <GhostTrailOverlay />
      <FlashlightOverlay />
      <SlimeOverlay />
    </>
  );
}


