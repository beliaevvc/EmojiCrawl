/**
 * GameFlowRoot — "граница" game-ветки (Блок 6).
 *
 * Слой: App / Framework (composition root boundary).
 *
 * ## Что это
 * “Граница” (boundary) для game‑ветки приложения. Это НЕ просто alias на `GameFlow`,
 * а точка, где мы фиксируем жизненный цикл игровой сессии и зависимости game‑флоу.
 *
 * ## Зачем
 * Нам нужно, чтобы:
 * - состояние забега (GameSession) жило **в пределах game‑ветки**,
 * - при выходе в меню оно сбрасывалось,
 * - внутриигровые экраны (`inGameView`: combat/pause/будущие story/shop/...) могли
 *   переключаться без потери состояния.
 *
 * Поэтому `GameSessionProvider` подключаем именно здесь, а не в `AppRouter` и не в `GameScreen`.
 *
 * ## Что делает
 * - Оборачивает `GameFlow` в `GameSessionProvider`.
 * - Проксирует входные параметры старта забега (`deckConfig/runType/templateName`) дальше в UI.
 *
 * ## Инварианты / правила
 * - Внутри `GameFlowRoot` не должно быть механики игры и UI‑логики боя.
 * - Этот файл — composition boundary: здесь разрешено подключать провайдеры/инъекции,
 *   но запрещено раздувать его в “ещё один роутер”.
 * - Поведение игры не меняем: это архитектурная перестановка владельца `GameState`.
 *
 * Примечание:
 * - `GameFlow` всегда держит `GameScreen` смонтированным → состояние забега не теряется
 *   при открытии паузы/оверлеев.
 */
import GameFlow from '@/features/game/ui/GameFlow';
import type { DeckConfig } from '@/types/game';
import { GameSessionProvider } from '@/features/game/application/react';
import { defaultClock, defaultRng } from '@/features/game/application/runtime/defaultRuntime';

type GameFlowRootProps = {
  onExitToMenu: () => void;
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
};

export function GameFlowRoot({ onExitToMenu, deckConfig, runType, templateName }: GameFlowRootProps) {
  return (
    <GameSessionProvider rng={defaultRng} clock={defaultClock}>
      <GameFlow onExitToMenu={onExitToMenu} deckConfig={deckConfig} runType={runType} templateName={templateName} />
    </GameSessionProvider>
  );
}


