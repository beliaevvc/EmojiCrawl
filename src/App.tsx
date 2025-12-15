import { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import StatsScreen from './components/StatsScreen';
import DeckbuilderScreen from './components/DeckbuilderScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { DeckConfig, DeckTemplate } from './types/game';

// Safely detect touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Use TouchBackend for touch devices, HTML5Backend otherwise
const Backend = isTouchDevice() ? TouchBackend : HTML5Backend;

function App() {
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
    <DndProvider backend={Backend}>
      <ErrorBoundary>
        <div className="bg-stone-950 min-h-screen text-stone-100 font-sans selection:bg-rose-500/30">
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
            <GameScreen 
                key="game" 
                onExit={handleExitGame} 
                deckConfig={customDeckConfig}
                runType={customDeckConfig ? 'custom' : 'standard'}
                templateName={activeTemplateName}
            />
          )}
          {gameState === 'stats' && (
            <StatsScreen key="stats" onBack={() => setGameState('menu')} />
          )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    </DndProvider>
  );
}

export default App;
