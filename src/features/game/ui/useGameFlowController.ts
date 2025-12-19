/**
 * useGameFlowController — view-model/контроллер внутриигровой навигации (inGameView).
 *
 * Контекст:
 * - Под-блок 2A (in-game navigation): хотим иметь `inGameView` (боевой экран + overlay-пауза),
 *   при этом не терять состояние забега.
 * - Блок 6: состояние забега живёт на “границе game‑ветки” (`GameFlowRoot` → `GameSessionProvider`),
 *   поэтому этот контроллер отвечает только за навигацию/оверлеи, а не за доменную механику.
 *
 * Слой: UI (React).
 *
 * ## Что это
 * View-model (контроллер) для `GameFlow`: отдельный хук, который инкапсулирует
 * логику `inGameView`, стек истории и поведение клавиши Esc.
 *
 * ## Зачем
 * - Чтобы `GameFlow.tsx` оставался чистой компоновкой.
 * - Чтобы навигация была детерминированной и читабельной (один владелец истории/ESC).
 * - Чтобы в будущем расширять `inGameView` (story/shop/rewards) без расползания логики.
 *
 * ## Что делает
 * - Держит `inGameView` (пока: `combat` ↔ `pause`) и стек `history`.
 * - Реализует `openPause()` (переход в паузу) и `goBack()` (возврат по истории).
 * - Ставит обработчик Esc:
 *   - из боя открываем паузу,
 *   - из паузы — возвращаемся назад.
 *
 * ## Что НЕ делает (важно)
 * - Не владеет `GameState` и не меняет механику игры.
 * - Не завершает забег и не “выходит в меню” — этим владеет верхний уровень (`AppRouter`),
 *   а пауза только вызывает переданный колбэк.
 *
 * Выход:
 * - флаги `isPaused/canGoBack`,
 * - классы/props, нужные `GameFlow` для блокировки interaction в бою во время паузы,
 * - actions `openPause/goBack`.
 *
 * Инварианты:
 * - `GameScreen` остаётся смонтированным при паузе (state забега не сбрасывается).
 * - поведение 1:1 относительно предыдущей inline-реализации.
 */
import { useCallback, useEffect, useState } from 'react';

export type InGameView = 'combat' | 'pause';

export type UseGameFlowControllerResult = {
  inGameView: InGameView;
  canGoBack: boolean;
  isPaused: boolean;

  // Хелпер пропса для UI: блокируем интеракции в бою, пока поверх открыта пауза.
  gameScreenContainerClassName: string;

  // Действия навигации
  openPause: () => void;
  goBack: () => void;
};

export function useGameFlowController(): UseGameFlowControllerResult {
  const [inGameView, setInGameView] = useState<InGameView>('combat');
  const [history, setHistory] = useState<InGameView[]>([]);

  const canGoBack = history.length > 0;
  const isPaused = inGameView === 'pause';

  const navigate = useCallback(
    (to: InGameView) => {
      setHistory((h) => [...h, inGameView]);
      setInGameView(to);
    },
    [inGameView]
  );

  const goBack = useCallback(() => {
    setHistory((h) => {
      const next = [...h];
      const prev = next.pop();
      setInGameView(prev ?? 'combat');
      return next;
    });
  }, []);

  const openPause = useCallback(() => navigate('pause'), [navigate]);

  // Esc: бой → пауза → назад
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (inGameView === 'pause') goBack();
      else openPause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inGameView, openPause, goBack]);

  return {
    inGameView,
    canGoBack,
    isPaused,
    gameScreenContainerClassName: isPaused ? 'pointer-events-none select-none' : '',
    openPause,
    goBack,
  };
}


