import { useState, useEffect, useRef } from 'react';
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
import DevConsole from './components/DevConsole';
import { useDevQuestStore } from './stores/useDevQuestStore';
import { useAuthStore } from './stores/useAuthStore';
import { Terminal, Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { useSettingsStore } from './stores/useSettingsStore';

// Safely detect touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Use TouchBackend for touch devices, HTML5Backend otherwise
const Backend = isTouchDevice() ? TouchBackend : HTML5Backend;

import { GhostTrailOverlay } from './components/GhostTrailOverlay';
import { FlashlightOverlay } from './components/FlashlightOverlay';
import { SlimeOverlay } from './components/SlimeOverlay';
import { isFlashlightLocked } from './utils/flashlightLock';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'game' | 'stats' | 'deckbuilder'>('menu');
  const [customDeckConfig, setCustomDeckConfig] = useState<DeckConfig | undefined>(undefined);
  const [initialTemplate, setInitialTemplate] = useState<DeckTemplate | null>(null);
  const [activeTemplateName, setActiveTemplateName] = useState<string | undefined>(undefined);

  const { completeAnomaly, toggleConsole, resetQuest, isConsoleOpen } = useDevQuestStore();
  const { user } = useAuthStore();
  const { isScreensaverEnabled } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keyBufferRef = useRef('');

  // Quest Logic
  useEffect(() => {
    const handleActivity = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      if (!isScreensaverEnabled) return;

      idleTimerRef.current = setTimeout(() => {
        completeAnomaly('IDLE_STATE');
      }, 60000); // 60 seconds
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      handleActivity();

      // Magic Words
      keyBufferRef.current = (keyBufferRef.current + e.key).slice(-10).toLowerCase();
      
      if (keyBufferRef.current.endsWith('lumos')) {
        if (!isFlashlightLocked()) {
          completeAnomaly('MAGIC_WORD_1');
          // Trigger flashlight effect if not already handled by existing logic
          window.dispatchEvent(new CustomEvent('toggle-flashlight', { detail: true }));
        }
      }
      if (keyBufferRef.current.endsWith('nox')) {
        if (!isFlashlightLocked()) {
          window.dispatchEvent(new CustomEvent('toggle-flashlight', { detail: false }));
        }
      }
      
      // SBROS - Full Reset
      if (keyBufferRef.current.endsWith('sbros')) {
          resetQuest();
          if (isConsoleOpen) {
              toggleConsole(); // Close if open to refresh state visually next time
          }
          // Optional: Add a subtle log or sound? 
          console.log('System Reset Initiated');
      }

      // Bio Input
      if (keyBufferRef.current.endsWith('mouse')) {
        completeAnomaly('BIO_INPUT');
        // Trigger slime/mouse effect
        window.dispatchEvent(new CustomEvent('toggle-slime', { detail: true }));
      }
      if (keyBufferRef.current.endsWith('cat')) {
        window.dispatchEvent(new CustomEvent('toggle-slime', { detail: false }));
      }
    };

    const handleClick = (e: MouseEvent) => {
      handleActivity();

      // Matrix Break
      if (e.altKey) {
        completeAnomaly('MATRIX_BREAK');
        // Optional: Trigger visual glitch
      }
      
      // Entropy Overload (Rapid clicks)
      clickCountRef.current++;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000); // Reset count after 1s of no clicks

      if (clickCountRef.current >= 15) {
        completeAnomaly('ENTROPY_OVERLOAD');
        clickCountRef.current = 0;
      }
    };

    const handleMouseMove = () => handleActivity();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);

    // Initial idle timer start
    handleActivity();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, [completeAnomaly, isScreensaverEnabled]);

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
        <DevConsole />
        <GhostTrailOverlay />
        <FlashlightOverlay />
        <SlimeOverlay />
        <div className="bg-stone-950 min-h-screen text-stone-100 font-sans selection:bg-rose-500/30 relative">
           
           {/* Console Toggle & Settings */}
           {user && (
             <div className="fixed bottom-2 right-2 flex gap-2 z-50">
               <button 
                 className="p-2 text-stone-700 hover:text-stone-400 transition-all opacity-50 hover:opacity-100"
                 onClick={() => setShowSettings(true)}
                 title="Settings"
               >
                 <Settings size={16} />
               </button>
               <button 
                 className="p-2 text-stone-700 hover:text-green-500 transition-all opacity-50 hover:opacity-100"
                 onClick={toggleConsole}
                 title="Dev Console"
               >
                 <Terminal size={16} />
               </button>
             </div>
           )}

           <AnimatePresence>
             {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
           </AnimatePresence>

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
