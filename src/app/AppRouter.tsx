/**
 * AppRouter — верхнеуровневая навигация приложения (Блок 6).
 *
 * Слой: App / Framework (composition root).
 *
 * ## Что это
 * Мини‑“роутер” приложения на основе локального состояния (state-machine).
 * Мы сознательно НЕ используем React Router на этом этапе — чтобы миграция оставалась
 * маленькой и безопасной.
 *
 * ## Зачем
 * - Держать верхнеуровневое переключение экранов в одном месте и не раздувать `App.tsx`.
 * - Явно выделить “границу game‑ветки” (`GameFlowRoot`), где живёт жизненный цикл game‑сессии.
 * - Сохранить поведение 1:1 с историческим `App.tsx`.
 *
 * ## Что делает
 * - Хранит текущее состояние приложения: `menu | game | stats | deckbuilder`.
 * - Передаёт колбэки между экранами (start game, back, exit to menu).
 * - Держит промежуточные данные, нужные для переходов:
 *   - `customDeckConfig` (кастомный забег),
 *   - `initialTemplate` (шаблон для deckbuilder),
 *   - `activeTemplateName` (имя шаблона для отображения/логов).
 * - Использует `AnimatePresence` для плавных переходов, но НЕ содержит бизнес‑логики.
 *
 * ## Инварианты / правила
 * - Здесь не должно быть логики домена/приложения (rules/use-cases) — только UI‑навигация.
 * - Game‑логика и состояние забега не должны жить здесь: для этого есть `GameFlowRoot`
 *   (граница game‑ветки).
 *
 * ## Почему `GameFlowRoot`, а не прямой `GameFlow`
 * `GameFlowRoot` — “composition boundary”: мы можем обернуть game‑ветку провайдерами
 * (например, `GameSessionProvider`) не затрагивая остальной роутер.
 *
 * Важно:
 * - не вводим полноценный роутинг (React Router) — остаёмся на текущей модели state-machine,
 * - держим этот модуль тонким: только переключение между экранами menu/game/stats/deckbuilder,
 * - поведение 1:1 с прежним `App.tsx`.
 */
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MainMenu from '@/components/MainMenu';
import StatsScreen from '@/components/StatsScreen';
import DeckbuilderScreen from '@/components/DeckbuilderScreen';
import type { DeckConfig, DeckTemplate } from '@/types/game';
import { GameFlowRoot } from '@/app/game/GameFlowRoot';

export function AppRouter() {
  const [gameState, setGameState] = useState<'menu' | 'game' | 'stats' | 'deckbuilder'>('menu');
  const [customDeckConfig, setCustomDeckConfig] = useState<DeckConfig | undefined>(undefined);
  const [initialTemplate, setInitialTemplate] = useState<DeckTemplate | null>(null);
  const [activeTemplateName, setActiveTemplateName] = useState<string | undefined>(undefined);

  const handleStartCustomGame = (config: DeckConfig, templateName?: string) => {
    setCustomDeckConfig(config);
    setActiveTemplateName(templateName);
    setGameState('game');
  };

  const handleStartStandardGame = () => {
    setCustomDeckConfig(undefined);
    setActiveTemplateName(undefined);
    setGameState('game');
  };

  const handleExitGame = () => {
    setGameState('menu');
    setCustomDeckConfig(undefined);
    setActiveTemplateName(undefined);
    setInitialTemplate(null);
  };

  const handleLoadTemplate = (template: DeckTemplate) => {
    setInitialTemplate(template);
    setGameState('deckbuilder');
  };

  return (
    <AnimatePresence mode="wait">
      {gameState === 'menu' && (
        <MainMenu
          key="menu"
          onStartGame={handleStartStandardGame}
          onCreateGame={() => {
            setInitialTemplate(null);
            setGameState('deckbuilder');
          }}
          onShowStats={() => setGameState('stats')}
          onLoadTemplate={handleLoadTemplate}
        />
      )}
      {gameState === 'deckbuilder' && (
        <DeckbuilderScreen
          key="deckbuilder"
          onBack={() => {
            setGameState('menu');
            setInitialTemplate(null);
          }}
          onStartStandard={handleStartStandardGame}
          onStartCustom={handleStartCustomGame}
          initialTemplate={initialTemplate}
        />
      )}
      {gameState === 'game' && (
        <GameFlowRoot
          key="game"
          onExitToMenu={handleExitGame}
          deckConfig={customDeckConfig}
          runType={customDeckConfig ? 'custom' : 'standard'}
          templateName={activeTemplateName}
        />
      )}
      {gameState === 'stats' && <StatsScreen key="stats" onBack={() => setGameState('menu')} />}
    </AnimatePresence>
  );
}


