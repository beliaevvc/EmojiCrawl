/**
 * useStartGameFlow
 *
 * Контекст (Блок 3): вынесено из `GameScreen` в `ui/`, чтобы экран стал компоновкой
 * и чтобы “старт/рестарт” можно было переиспользовать в других внутриигровых экранах.
 *
 * Слой: UI (React).
 *
 * Инкапсулирует повторяющуюся логику "старт/рестарт забега":
 * - один раз на маунте стартуем игру с параметрами экрана (как раньше),
 * - предоставляем `restartGame()` для кнопок "начать заново" (confirm и endgame overlay).
 *
 * Входы:
 * - `startGame(args)` — внешняя команда старта (обычно `dispatch(gameSession.startGame(args))`),
 * - `deckConfig/runType/templateName` — параметры текущего запуска (стандартный/кастомный).
 *
 * Выход:
 * - `restartGame()` — перезапуск с актуальными параметрами.
 *
 * Важно: поведение 1:1:
 * - старт на маунте берёт значения пропсов на момент первого рендера (как прежний useEffect с []),
 * - рестарт использует актуальные значения пропсов на момент клика.
 *
 * Инварианты:
 * - этот хук НЕ содержит доменной логики и не хранит `GameState`,
 * - он только управляет “когда вызвать startGame”, чтобы UI-слой был аккуратным.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { DeckConfig } from '@/types/game';

export type StartGameArgs = {
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
};

export type UseStartGameFlowParams = StartGameArgs & {
  startGame: (args: StartGameArgs) => void;
};

export function useStartGameFlow(params: UseStartGameFlowParams) {
  const { startGame, deckConfig, runType = 'standard', templateName } = params;

  // На маунте стартуем один раз с начальными значениями (1:1 со старым useEffect(..., [])).
  const initialArgsRef = useRef<StartGameArgs>({ deckConfig, runType, templateName });

  useEffect(() => {
    startGame(initialArgsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Рестарт: используем актуальные значения пропсов (как раньше в обработчиках клика).
  const restartGame = useCallback(() => {
    startGame({ deckConfig, runType, templateName });
  }, [deckConfig, runType, startGame, templateName]);

  return { restartGame };
}


