import { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import { AnimatePresence } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

// Safely detect touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Use TouchBackend for touch devices, HTML5Backend otherwise
const Backend = isTouchDevice() ? TouchBackend : HTML5Backend;

function App() {
  const [gameState, setGameState] = useState<'menu' | 'game'>('menu');

  return (
    <DndProvider backend={Backend}>
      <div className="bg-stone-950 min-h-screen text-stone-100 font-sans selection:bg-rose-500/30">
         <AnimatePresence mode="wait">
          {gameState === 'menu' ? (
            <MainMenu key="menu" onStartGame={() => setGameState('game')} />
          ) : (
            <GameScreen key="game" onExit={() => setGameState('menu')} />
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}

export default App;
