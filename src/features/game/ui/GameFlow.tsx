/**
 * GameFlow — внутриигровая “навигация” (inGameView) для game-ветки.
 *
 * Контекст:
 * - Под-блок 2A (in-game navigation): вводим `inGameView` и overlay-паузы без размонтирования боя.
 * - Блок 3: `GameScreen` стал тонким screen, а логика живёт в контроллерах/хуках.
 * - Блок 6: “граница game‑ветки” вынесена в `GameFlowRoot`, и именно там живёт `GameSessionProvider`.
 *
 * Слой: UI (React).
 *
 * ## Что это
 * Внутриигровой “flow layout” для game‑ветки. Это НЕ верхнеуровневый роутер всего приложения,
 * а локальная навигация “внутри забега”: какие именно экраны/оверлеи показываем поверх боя.
 *
 * ## Зачем
 * Нам важно, чтобы:
 * - пауза/overlay не сбрасывали состояние боя,
 * - в будущем можно было добавить новые внутриигровые экраны (story/shop/rewards)
 *   без переписывания `AppRouter` и без превращения `GameFlow` в “бог‑файл”.
 *
 * ## Что делает
 * - Всегда держит `GameScreen` смонтированным (state забега не теряется).
 * - Поверх показывает overlay паузы.
 * - Делегирует всю логику переходов/истории/Esc в `useGameFlowController`.
 *
 * ## Где живёт состояние забега
 * `GameFlow` сам не владеет `GameState`. Он работает внутри `GameFlowRoot`,
 * где подключён `GameSessionProvider` (Блок 6).
 * Поэтому `GameScreen`/контроллеры читают `state/dispatch` через контекст сессии.
 *
 * ## Инварианты / правила
 * - Этот файл остаётся компоновкой: никаких доменных правил, никаких use-cases уровня приложения.
 * - `GameScreen` не размонтируется при паузе.
 * - Никаких прямых подписок на window-events: это либо `useGameFlowController`, либо плагины в `src/app/plugins/*`.
 *
 * Почему это важно:
 * - когда появятся новые внутриигровые экраны (story/shop/rewards), этот файл не должен
 *   превратиться в новый “бог-файл” — он остаётся компоновкой.
 */

import GameScreen from '@/components/game/screens/GameScreen';
import type { DeckConfig } from '@/features/game/domain/model/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameFlowController } from './useGameFlowController';

type GameFlowProps = {
  onExitToMenu: () => void;
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
};

function PauseOverlay({
  onResume,
  onExitToMenu,
  canGoBack,
}: {
  onResume: () => void;
  onExitToMenu: () => void;
  canGoBack: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onResume} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="relative z-[210] w-[min(520px,92vw)] rounded-2xl border border-stone-700 bg-stone-950/90 shadow-2xl p-5"
      >
        <div className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">Пауза</div>
        <div className="mt-2 text-lg font-bold text-stone-100">Забег приостановлен</div>
        <div className="mt-1 text-sm text-stone-400">
          Состояние не сбрасывается. Нажми Esc или “Продолжить”.
          {!canGoBack && <span className="ml-2 text-stone-500">(нет истории: вернёмся в бой)</span>}
        </div>

        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onExitToMenu}
            className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-900/20 text-rose-200 font-bold tracking-widest uppercase text-xs hover:bg-rose-900/35 transition-colors"
          >
            Выйти в меню
          </button>
          <button
            onClick={onResume}
            className="px-4 py-2 rounded-xl border border-indigo-500/40 bg-indigo-900/20 text-indigo-200 font-bold tracking-widest uppercase text-xs hover:bg-indigo-900/35 transition-colors"
          >
            Продолжить
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GameFlow({ onExitToMenu, deckConfig, runType, templateName }: GameFlowProps) {
  const flow = useGameFlowController();

  return (
    <div className="relative w-full h-full">
      {/* Важно: GameScreen всегда смонтирован => state не теряется */}
      <div className={flow.gameScreenContainerClassName}>
        <GameScreen
          onExit={onExitToMenu}
          deckConfig={deckConfig}
          runType={runType}
          templateName={templateName}
          onOpenPause={flow.openPause}
        />
      </div>

      <AnimatePresence>
        {flow.isPaused && (
          <PauseOverlay onResume={flow.goBack} onExitToMenu={onExitToMenu} canGoBack={flow.canGoBack} />
        )}
      </AnimatePresence>
    </div>
  );
}


