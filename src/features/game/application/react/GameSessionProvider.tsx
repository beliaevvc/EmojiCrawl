/**
 * GameSessionProvider — React‑адаптер для игровой сессии (контейнер жизненного цикла).
 *
 * Слой: Application / React adapter (внешний адаптер application слоя).
 *
 * ## Что это
 * Провайдер, который держит состояние забега (`GameState`) и даёт UI:
 * - доступ к `state`,
 * - доступ к `dispatch` доменных `GameAction`,
 * - набор “команд” уровня приложения (`commands`), которые мапятся на `GameAction`
 *   через `gameSession` (application фасад).
 *
 * ## Зачем
 * В Блоке 6 мы фиксируем “границу game‑ветки” (`GameFlowRoot`) и переносим владение
 * состоянием забега из конкретного экрана (`GameScreen`) на уровень game‑ветки.
 *
 * Это нужно, чтобы:
 * - состояние сессии жило между внутриигровыми экранами (`inGameView`: combat/pause/...),
 * - UI мог свободно компонировать экраны/оверлеи без риска “потерять state”,
 * - у нас была единая точка, куда позже можно добавить инфраструктурные зависимости
 *   (например, RNG/Clock порты, аналитика, сохранения) не затрагивая UI.
 *
 * ## Что делает
 * - Инициализирует `useReducer(gameReducer, initialState)` (domain reducer).
 * - Создаёт объект `commands`, который вызывает `dispatch(gameSession.*(...))`.
 * - Прокидывает { state, dispatch, commands } через React context.
 *
 * ## Инварианты / правила
 * - Это не домен: здесь разрешён React, но запрещено смешивать UI‑визуал с логикой сессии.
 * - Домен остаётся чистым: reducer не должен импортировать React/DOM/infra.
 * - `commands` — удобный API для UI, но он не “умнее” домена: реальные правила остаются в domain reducer.
 * - Провайдер должен быть единственным владельцем state в рамках game‑ветки (одна сессия на один забег).
 */
/* eslint-disable react-refresh/only-export-components -- Здесь экспортируются Provider + hook. Для нас это ок; fast refresh не критичен для application/react адаптера. */

import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { DeckConfig, GameAction, GameState } from '@/features/game/domain/model/types';
import { createGameReducer, createInitialState } from '@/features/game/domain/reducer/gameReducer';
import { gameSession } from '@/features/game/application/gameSession';
import type { Clock } from '@/features/game/domain/ports/Clock';
import type { Rng } from '@/features/game/domain/ports/Rng';
import { defaultClock, defaultRng } from '@/features/game/application/runtime/defaultRuntime';

export type GameSessionCommands = {
  startGame: (input: { deckConfig?: DeckConfig; runType?: 'standard' | 'custom'; templateName?: string }) => void;
  takeCardToHand: (input: { cardId: string; hand: 'left' | 'right' | 'backpack' }) => void;
  useSpellOnTarget: (input: { spellCardId: string; targetId: string }) => void;
  sellItem: (input: { cardId: string }) => void;
  resetHand: () => void;
  activateCurse: (curse: NonNullable<GameState['curse']>) => void;
};

type GameSessionContextValue = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  commands: GameSessionCommands;
};

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export function GameSessionProvider({
  children,
  rng: rngOverride,
  clock: clockOverride,
}: {
  children: React.ReactNode;
  rng?: Rng;
  clock?: Clock;
}) {
  const rng = rngOverride ?? defaultRng;
  const clock = clockOverride ?? defaultClock;

  const reducer = useMemo(() => createGameReducer({ rng, clock }), [rng, clock]);

  // Важно: initial state зависит от Clock (см. Блок 8), поэтому инициализируем через initializer-функцию.
  const [state, dispatch] = useReducer(reducer, clock, (c) => createInitialState({ clock: c }));

  const commands: GameSessionCommands = useMemo(
    () => ({
      startGame: (input) => dispatch(gameSession.startGame(input)),
      takeCardToHand: (input) => dispatch(gameSession.takeCardToHand(input)),
      useSpellOnTarget: (input) => dispatch(gameSession.useSpellOnTarget(input)),
      sellItem: (input) => dispatch(gameSession.sellItem(input)),
      resetHand: () => dispatch(gameSession.resetHand()),
      activateCurse: (curse) => dispatch(gameSession.activateCurse(curse)),
    }),
    [dispatch]
  );

  const value = useMemo(() => ({ state, dispatch, commands }), [state, commands]);

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession() {
  const ctx = useContext(GameSessionContext);
  if (!ctx) {
    throw new Error('useGameSession must be used within GameSessionProvider');
  }
  return ctx;
}


