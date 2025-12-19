/**
 * GameSceneOverlays — визуальные слои сцены боя (background/overlay/баннеры).
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React). Чисто визуальный компонент.
 *
 * Что делает:
 * - рисует background-слои (узор/градиент),
 * - включает overlay “Тьма” при проклятии `darkness`,
 * - показывает баннер активации проклятия,
 * - рендерит `FloatingTextOverlay`.
 *
 * Входы:
 * - `floatingTexts` и `onFloatingTextComplete` — управление “плавающими цифрами”.
 * - `curse` — текущая активная метка проклятия (для “Тьмы” + баннера).
 *
 * Инварианты:
 * - никаких правил игры внутри, только визуал,
 * - z-index и `pointer-events` сохранены 1:1 со старым `GameScreen`.
 */
import { FloatingTextOverlay, type FloatingTextItem } from '../../FloatingText';
import { CurseActivationBanner } from '../../CurseActivationBanner';
import { MaskedFlashlightOverlay } from '../../MaskedFlashlightOverlay';
import type { CurseType } from '../../../types/game';

export type GameSceneOverlaysProps = {
  floatingTexts: FloatingTextItem[];
  onFloatingTextComplete: (id: string) => void;
  curse: CurseType | null;
};

export function GameSceneOverlays({ floatingTexts, onFloatingTextComplete, curse }: GameSceneOverlaysProps) {
  return (
    <>
      <FloatingTextOverlay items={floatingTexts} onComplete={onFloatingTextComplete} />

      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/20 via-stone-950/80 to-stone-950 pointer-events-none z-0" />
      <div
        className="absolute inset-0 flex justify-between opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent 49%, #000 50%, transparent 51%)',
          backgroundSize: '12.5% 100%',
        }}
      />

      {/* Curse "Тьма" overlay: darken field, but keep HUD/modals visible (higher z) */}
      <MaskedFlashlightOverlay enabled={curse === 'darkness'} radiusPx={150} softEdgePercent={10} zIndexClassName="z-[15]" />

      <CurseActivationBanner curse={curse || null} />
    </>
  );
}


