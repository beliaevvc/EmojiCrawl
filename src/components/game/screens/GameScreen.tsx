/**
 * GameScreen — экран боя (screen-компоновка).
 *
 * Слой: UI (React screen).
 *
 * ## Что это
 * “Экран” боя — максимально тонкая компоновка UI‑слоёв.
 * Здесь нет доменной механики и нет “оркестрации” действий: это задача контроллера.
 *
 * ## Зачем
 * - В Блоке 3 мы декомпозировали монолитный `GameScreen` на слои (overlays/hud/combat/modals)
 *   и вынесли всю склейку в `useGameScreenController`.
 * - В Блоке 6 состояние забега переехало в `GameSessionProvider` (граница game‑ветки),
 *   поэтому `GameScreen` можно держать смонтированным/перекомпоновывать без риска потерять state.
 *
 * ## Что делает
 * - Получает view-model `c` из `useGameScreenController` (props для слоёв + handlers).
 * - Рендерит слои:
 *   - `GameSceneOverlays` (визуальные эффекты сцены, floating texts и пр.)
 *   - `GameHudLayer` (верхняя панель + окна + нижняя панель)
 *   - `GameCombatLayer` (поле боя, руки/рюкзак, контролы)
 *   - `GameModals` (правила/пикеры/подтверждения/оверлеи завершения)
 * - Проксирует наружу “граничные” колбэки:
 *   - `onExit` (выход в меню, владелец — `AppRouter`)
 *   - `onOpenPause` (inGameView‑навигация, владелец — `GameFlow`)
 *
 * ## Инварианты / правила
 * - Здесь не должно быть вызовов `dispatch({type: ...})` напрямую — это живёт в контроллере/commands.
 * - Не добавлять сюда глобальные подписки/таймеры (для этого есть эффекты/контроллеры/плагины).
 * - Поведение 1:1: этот файл не должен менять механику игры, он только компонует UI.
 *
 * См. также:
 * - `useGameScreenController.ts` — view-model (state/handlers/props) + эффекты
 * - `GameSessionProvider.tsx` — владелец состояния забега (в пределах game‑ветки)
 * - `GameSceneOverlays.tsx`, `GameHudLayer.tsx`, `GameCombatLayer.tsx`, `GameModals.tsx`
 */
import { motion } from 'framer-motion';
import { DeckConfig } from '../../../types/game';
import { GameModals } from '../modals/GameModals';
import { useGameScreenController } from './useGameScreenController';
import { GameSceneOverlays } from './GameSceneOverlays';
import { GameHudLayer } from './GameHudLayer';
import { GameCombatLayer } from './GameCombatLayer';

interface GameScreenProps {
  onExit: () => void;
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
  onOpenPause?: () => void;
}

// Примечание: остальные “внутренние” компоненты/слои вынесены в отдельные файлы (см. импорты выше).

// DeckStatItem и CardsViewer вынесены в `src/components/game/*` (Блок 3).
// OverheadStatsWindow и GameLogWindow вынесены в `src/components/game/windows/*` (Блок 3).

const GameScreen = ({ onExit, deckConfig, runType = 'standard', templateName, onOpenPause }: GameScreenProps) => {
  const c = useGameScreenController({ deckConfig, runType, templateName });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full min-h-screen bg-[#141211] flex flex-col p-2 md:p-4 overflow-hidden select-none"
    >
      <GameSceneOverlays {...c.sceneOverlaysProps} />

      <GameHudLayer {...c.hudLayerProps} bottomBar={{ ...c.hudLayerProps.bottomBar, onOpenPause }} />

      <GameCombatLayer {...c.combatLayerProps} />

      <GameModals {...c.modalsPropsBase} onConfirmExit={onExit} onExitFromStats={onExit} />
    </motion.div>
  );
};

export default GameScreen;


