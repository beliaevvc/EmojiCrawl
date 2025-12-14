// ... imports
import React, { useReducer, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Flag, Search, X, Shield, Swords, Skull, Zap, Coins, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { gameReducer, initialState } from '../utils/gameReducer';
import CardComponent from './CardComponent';
import Slot from './Slot';
import { Card, LogEntry, Overheads, DeckConfig } from '../types/game';
import { ItemTypes } from '../types/DragTypes';
import { FloatingTextOverlay, FloatingTextItem } from './FloatingText';
import { GameStatsOverlay } from './GameStatsOverlay';
import { saveRun } from '../utils/statsStorage';
import { ConfirmationModal } from './ConfirmationModal';
import { SPELLS } from '../data/spells';
import { MONSTER_ABILITIES } from '../data/monsterAbilities';

const BUFF_SPELLS = ['trophy', 'deflection', 'echo', 'snack', 'armor'];

interface GameScreenProps {
  onExit: () => void;
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
}

// ... (Other components remain the same)
// Interaction Drop Zone Wrapper
const InteractionZone = ({ 
    onDrop, 
    accepts, 
    children, 
    className = "" 
}: { 
    onDrop: (item: any) => void, 
    accepts: string[], 
    children: React.ReactNode, 
    className?: string 
}) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: accepts,
        drop: (item: any, monitor) => {
            if (monitor.didDrop()) return;
            onDrop(item);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div ref={drop} className={`${className} ${isOver && canDrop ? 'ring-4 ring-rose-500/50 rounded-full' : ''}`}>
            {children}
        </div>
    );
}

const EnemySlotDropZone = ({ 
    card, 
    onDropOnEnemy, 
    children 
}: { 
    card: Card | null, 
    onDropOnEnemy: (item: any, targetId: string) => void,
    children: React.ReactNode 
}) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.CARD,
        // Allow spells AND weapons to be dropped on monsters
        canDrop: (item: any) => !!card && (item.type === 'spell' || (item.type === 'weapon' && card.type === 'monster')),
        drop: (item: any) => {
            if (card) onDropOnEnemy(item, card.id);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [card, onDropOnEnemy]);

    return (
        <div ref={drop} className={`relative w-full h-full flex items-center justify-center ${isOver && canDrop ? 'ring-2 ring-indigo-400 rounded-full scale-105 transition-transform' : ''}`}>
            {children}
        </div>
    );
}

const SellZone = ({ onSell, children }: { onSell: (item: any) => void, children: React.ReactNode }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.CARD,
        drop: (item: any) => onSell(item),
        collect: (monitor) => ({ isOver: !!monitor.isOver() })
    }), [onSell]);
    
    return <div ref={drop} className={isOver ? 'scale-110 transition-transform' : ''}>{children}</div>
};

// ... RulesModal (Keeping existing logic)
const RulesModal = ({ onClose }: { onClose: () => void }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
    >
        <div className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors">
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-stone-200 mb-6 text-center tracking-widest uppercase">Правила Игры</h2>
            <div className="space-y-6 text-stone-400 text-sm md:text-base h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                 <section>
                    <h3 className="flex items-center gap-2 text-stone-200 font-bold mb-2">
                        <Skull size={18} className="text-rose-500" /> Цель
                    </h3>
                    <p>Очистите колоду и стол от всех карт монстров. Выживите, сохранив HP больше 0.</p>
                </section>
                <section>
                    <h3 className="flex items-center gap-2 text-stone-200 font-bold mb-2">
                        <Swords size={18} className="text-stone-400" /> Бой
                    </h3>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                        <li>Перетащите <span className="text-rose-400">Монстра</span> на <span className="text-stone-300">Оружие</span>: монстр умирает, оружие теряет прочность.</li>
                        <li>Перетащите <span className="text-rose-400">Монстра</span> на <span className="text-stone-300">Щит</span>: щит поглощает урон.</li>
                        <li>Перетащите <span className="text-rose-400">Монстра</span> на <span className="text-green-400">Героя</span>: вы получаете полный урон.</li>
                    </ul>
                </section>
                <section>
                    <h3 className="flex items-center gap-2 text-stone-200 font-bold mb-2">
                        <Coins size={18} className="text-amber-400" /> Предметы
                    </h3>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                        <li><span className="text-amber-400">Монеты</span> и <span className="text-emerald-400">Зелья</span> используются автоматически при взятии в руку.</li>
                        <li>Использованный слот руки блокируется до конца раунда.</li>
                        <li>Оружие и Зелья можно <b>Продать</b> (кнопка 💎).</li>
                    </ul>
                </section>
                <section>
                    <h3 className="flex items-center gap-2 text-stone-200 font-bold mb-2">
                        <Zap size={18} className="text-indigo-400" /> Заклинания
                    </h3>
                    <p className="mb-2">Перетащите карту заклинания на цель:</p>
                    <ul className="space-y-2 ml-1">
                        <li>📜 <b>Побег</b> (на монстра): Замешать всех врагов в колоду.</li>
                        <li>📜 <b>Кровосос</b> (на монстра): Лечение на силу монстра.</li>
                        <li>📜 <b>Зельефикация</b> (на предмет): Превратить предмет в зелье.</li>
                        <li>📜 <b>Ветер</b> (на монстра/монету): Вернуть карту в колоду.</li>
                        <li>📜 <b>Жертва</b> (на монстра): Урон монстру (13 - ваш HP).</li>
                    </ul>
                </section>
                <section>
                    <h3 className="flex items-center gap-2 text-stone-200 font-bold mb-2">
                        <Shield size={18} className="text-stone-500" /> Сброс
                    </h3>
                    <p>Кнопка 🛡️ (-5 HP): Убирает все карты со стола в колоду. Доступно если HP {'>'} 5.</p>
                </section>
            </div>
        </div>
    </motion.div>
);

// Mini Stats Item Component
const DeckStatItem = ({ icon, count, color }: { icon: string, count: number, color: string }) => (
    <div className={`flex flex-col items-center justify-center w-8 h-10 bg-stone-900/90 border border-stone-700 rounded-md backdrop-blur-sm shadow-sm ${count === 0 ? 'opacity-30 grayscale' : ''}`}>
        <div className="text-sm">{icon}</div>
        <div className={`text-[10px] font-bold ${color}`}>{count}</div>
    </div>
);

// Overhead Stats Component
const OverheadStatsWindow = ({ overheads }: { overheads: Overheads }) => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-24 right-4 z-30 bg-stone-900/80 backdrop-blur-md border border-stone-700 rounded-xl p-3 shadow-xl w-48 pointer-events-none select-none"
    >
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 border-b border-stone-800 pb-1 flex items-center gap-2">
            <Activity size={12} /> Аналитика
        </h3>
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400/80 flex items-center gap-1.5"><Zap size={12}/> Overheal</span>
                <span className="font-mono font-bold text-emerald-200">{overheads.overheal}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-rose-400/80 flex items-center gap-1.5"><Swords size={12}/> Overkill</span>
                <span className="font-mono font-bold text-rose-200">{overheads.overdamage}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-blue-400/80 flex items-center gap-1.5"><Shield size={12}/> Overdef</span>
                <span className="font-mono font-bold text-blue-200">{overheads.overdef}</span>
            </div>
        </div>
    </motion.div>
);

// Game Log Component
const GameLogWindow = ({ logs }: { logs: LogEntry[] }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`
                absolute bottom-20 right-4 z-40 
                bg-stone-900/80 backdrop-blur-md border border-stone-700 
                rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300
                w-64 md:w-80
                ${expanded ? 'h-[60vh]' : 'h-32'}
            `}
        >
             <div 
                className="flex items-center justify-between p-2 bg-stone-800/50 border-b border-stone-700 cursor-pointer hover:bg-stone-800 transition-colors"
                onClick={() => setExpanded(!expanded)}
             >
                 <span className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-2">Журнал</span>
                 {expanded ? <ChevronDown size={16} className="text-stone-400" /> : <ChevronUp size={16} className="text-stone-400" />}
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar flex flex-col-reverse">
                 {logs.map((log) => {
                     let color = 'text-stone-400';
                     if (log.type === 'combat') color = 'text-rose-400';
                     if (log.type === 'heal') color = 'text-emerald-400';
                     if (log.type === 'gain') color = 'text-amber-400';
                     if (log.type === 'spell') color = 'text-indigo-400';

                     return (
                         <div key={log.id} className={`text-[10px] md:text-xs ${color} font-medium leading-tight border-b border-stone-800/50 pb-1 last:border-0`}>
                             {log.message}
                         </div>
                     )
                 })}
                 {logs.length === 0 && <div className="text-center text-stone-600 text-xs py-4">Нет записей...</div>}
             </div>
        </motion.div>
    );
};


const GameScreen = ({ onExit, deckConfig, runType = 'standard', templateName }: GameScreenProps) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // Deck Stats & Logs Toggle
  
  // Visual Effects State
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const prevHeroHp = useRef(state.player.hp);
  const [heroShake, setHeroShake] = useState(false);
  
  // Coin Effect State
  const prevCoinsRef = useRef(state.player.coins);
  const [coinPulse, setCoinPulse] = useState(false);

  // Track Enemy Slots for animations
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevEnemySlots = useRef(state.enemySlots);
  
  const leftHandRef = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);
  const backpackRef = useRef<HTMLDivElement>(null);

  // Monitor Effects (Corrosion)
  useEffect(() => {
      if (state.lastEffect && state.lastEffect.type === 'corrosion') {
          // Find target slot ref
          let ref = null;
          // Check IDs. Note: The card ID in state might be same, but we need to match it.
          // Since state is updated, we check current slots.
          if (state.leftHand.card?.id === state.lastEffect.targetId) ref = leftHandRef;
          else if (state.rightHand.card?.id === state.lastEffect.targetId) ref = rightHandRef;
          else if (state.backpack?.id === state.lastEffect.targetId) ref = backpackRef;

          if (ref && ref.current) {
               const rect = ref.current.getBoundingClientRect();
               const x = rect.left + rect.width / 2;
               const y = rect.top + rect.height / 2;
               addFloatingText(x, y, '☣️ -2', 'text-lime-400 font-bold text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-[100]', true);
          }
      }
  }, [state.lastEffect]);

  // Calculate Deck Stats
  // Safety check: ensure cards in deck are NOT on table/hand (prevent ghost duplicates in stats)
  const cardsInPlayIds = new Set([
      ...state.enemySlots.filter(c => c).map(c => c!.id),
      state.leftHand.card?.id,
      state.rightHand.card?.id,
      state.backpack?.id
  ].filter(Boolean) as string[]);

  const cleanDeck = state.deck.filter(c => !cardsInPlayIds.has(c.id));

  const deckStats = cleanDeck.reduce((acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
  }, {
      monster: 0,
      coin: 0,
      potion: 0,
      shield: 0,
      weapon: 0,
      spell: 0,
      skull: 0
  } as Record<string, number>);

  const activeBuffs = state.activeEffects.filter(e => BUFF_SPELLS.includes(e));

  // Epiphany Effect Timer
  useEffect(() => {
      if (state.peekCards) {
          const timer = setTimeout(() => {
              dispatch({ type: 'CLEAR_PEEK' });
          }, 5000);
          return () => clearTimeout(timer);
      }
  }, [state.peekCards]);

  // Scout Effect Timer
  useEffect(() => {
      if (state.scoutCards) {
          const timer = setTimeout(() => {
              dispatch({ type: 'CLEAR_SCOUT' });
          }, 3000); // 3 seconds
          return () => clearTimeout(timer);
      }
  }, [state.scoutCards]);

  useEffect(() => {
    dispatch({ 
        type: 'START_GAME', 
        deckConfig, 
        runType,
        templateName
    });
  }, []);

  // Monitor Game Status for Saving
  useEffect(() => {
      if (state.status === 'won' || state.status === 'lost') {
          saveRun(state.stats, state.status, state.overheads);
      }
  }, [state.status, state.stats, state.overheads]);

  // Monitor Hero HP for visual effects
  useEffect(() => {
      const diff = state.player.hp - prevHeroHp.current;
      if (diff !== 0 && heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top;

          if (diff < 0) {
              // Damage
              addFloatingText(x, y, `${diff}`, 'text-rose-500', true);
              setHeroShake(true);
              setTimeout(() => setHeroShake(false), 300);
          } else {
              // Heal
              // Check if this was Blessing (handled separately with delay)
              const recentLogs = state.logs.slice(0, 3);
              const isBlessing = recentLogs.some(l => l.message.includes('БЛАГОСЛОВЕНИЕ'));
              
              if (!isBlessing) {
                  addFloatingText(x, y, `+${diff}`, 'text-emerald-400', true);
              }
          }
      }
      prevHeroHp.current = state.player.hp;
  }, [state.player.hp]);

  // Monitor Coins for visual effects
  useEffect(() => {
      const diff = state.player.coins - prevCoinsRef.current;
      if (diff !== 0 && heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          // Spawn coin text at the right edge, slightly up from center vertically
          const x = rect.right; 
          const y = rect.top + rect.height / 2 - 15;

          if (diff > 0) {
              addFloatingText(x, y, `+${diff} 💎`, 'text-amber-400');
              setCoinPulse(true);
              setTimeout(() => setCoinPulse(false), 300);
          } else if (diff < 0) {
              addFloatingText(x, y, `${diff} 💎`, 'text-rose-500');
          }
      }
      prevCoinsRef.current = state.player.coins;
  }, [state.player.coins]);

  // Monitor Logs for Armor Trigger
  const [armorFlash, setArmorFlash] = useState(false);
  const [healFlash, setHealFlash] = useState(false);
  const lastBlessingId = useRef<string | null>(null);

  useEffect(() => {
      const lastLog = state.logs[0];
      if (lastLog && lastLog.message.includes('Доспехи заблокировали')) {
          setArmorFlash(true);
          setTimeout(() => setArmorFlash(false), 400); // Quick flash

          if (heroRef.current) {
              const rect = heroRef.current.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top;
              addFloatingText(x, y, '🛡️ BLOCKED', 'text-yellow-300 font-bold text-lg drop-shadow-md', true);
          }
      }
  }, [state.logs]);

  // Monitor Logs for Blessing (Delayed Heal Effect)
  useEffect(() => {
      const blessingLog = state.logs.slice(0, 3).find(l => l.message.includes('БЛАГОСЛОВЕНИЕ'));
      
      if (blessingLog && blessingLog.id !== lastBlessingId.current) {
          lastBlessingId.current = blessingLog.id;
          
          const timer = setTimeout(() => {
              if (heroRef.current) {
                   const rect = heroRef.current.getBoundingClientRect();
                   const x = rect.left + rect.width / 2;
                   const y = rect.top;
                   addFloatingText(x, y, '+2', 'text-emerald-400', true);
                   setHealFlash(true);
                   setTimeout(() => setHealFlash(false), 500);
              }
          }, 700); // Delay to show sequence: Kill -> Wait -> Heal
          return () => clearTimeout(timer);
      }
  }, [state.logs]);

  // Monitor Logs for Silence Block
  useEffect(() => {
      const lastLog = state.logs[0];
      if (lastLog && lastLog.message.includes('МОЛЧАНИЕ: Магия заблокирована')) {
          let x = window.innerWidth / 2;
          let y = window.innerHeight * 0.25;

          if (slotRefs.current[0] && slotRefs.current[3]) {
              const r1 = slotRefs.current[0].getBoundingClientRect();
              const r2 = slotRefs.current[3].getBoundingClientRect();
              x = (r1.left + r2.right) / 2;
              y = r1.top - 30;
          }

          addFloatingText(x, y, '🚫 МАГИЯ ЗАБЛОКИРОВАНА', 'text-rose-400 font-bold text-xs md:text-sm drop-shadow-md bg-stone-900/95 px-3 py-1.5 rounded-lg border border-rose-500/40 backdrop-blur-md z-[100] tracking-wider', true);
      }
      // Add Stealth Miss Notification - Removed global watcher to use targeted local check
      // if (lastLog && lastLog.message.includes('СКРЫТНОСТЬ: Нельзя атаковать')) { ... }
  }, [state.logs]);

  // Monitor Enemy Slots for damage numbers
  useEffect(() => {
      // Check for Swap Action
      const lastLog = state.logs[0];
      const isSwap = lastLog && lastLog.message.includes('ЗАМЕНА');
      const isMirror = lastLog && lastLog.message.includes('ЗЕРКАЛО');
      const isGraveyard = lastLog && lastLog.message.includes('КЛАДБИЩЕ');

      state.enemySlots.forEach((card, i) => {
          const prevCard = prevEnemySlots.current[i];
          const slotEl = slotRefs.current[i];

          if (slotEl) {
              let diff = 0;
              let hasChanged = false;
              let newValue = 0;

              // Check if this specific card was just revived by Graveyard
              const isNewCard = card && (!prevCard || prevCard.id !== card.id);

              if (isNewCard && isGraveyard) {
                   const rect = slotEl.getBoundingClientRect();
                   const x = rect.left + rect.width / 2;
                   const y = rect.top;
                   addFloatingText(x, y, '👻 ВОСКРЕС!', 'text-purple-400 font-bold text-lg drop-shadow-md tracking-wider', true);
              }

              if (prevCard && prevCard.type === 'monster') {
                  // Case 1: Monster changed (alive)
                  if (card && card.type === 'monster' && card.id === prevCard.id) {
                      diff = prevCard.value - card.value;
                      newValue = card.value;
                      if (diff !== 0) hasChanged = true;
                  }
                  // Case 2: Monster died (card is null)
                  else if (!card) {
                       // Check if removal was due to non-damage effects
                       const recentLogs = state.logs.slice(0, 3);
                       const isNonDamageRemoval = recentLogs.some(log => 
                           log.message.includes('ВЕТЕР') || 
                           log.message.includes('ПОБЕГ') || 
                           log.message.includes('СБРОС') ||
                           log.message.includes('БАРЬЕР')
                       );

                       if (!isNonDamageRemoval) {
                           diff = prevCard.value;
                           hasChanged = true;
                       }
                  }

                  if (hasChanged) {
                      const rect = slotEl.getBoundingClientRect();
                      const x = rect.left + rect.width / 2;
                      const y = rect.top;

                      if (isSwap && card) {
                          // SWAP ANIMATION
                          addFloatingText(x, y, `🔄 ${newValue}`, 'text-indigo-400 font-bold text-xl drop-shadow-black', true);
                      } else if (isMirror && card) {
                          addFloatingText(x, y, `⚙️ ${newValue}`, 'text-cyan-400 font-bold text-xl drop-shadow-black', true);
                      } else if (diff > 0) {
                          // Damage
                          addFloatingText(x, y, `-${diff}`, 'text-rose-500', true);
                      } else if (diff < 0) {
                          // Heal
                          addFloatingText(x, y, `+${Math.abs(diff)}`, 'text-emerald-400', true);
                      }
                  }
              }
          }
      });
      prevEnemySlots.current = state.enemySlots;
  }, [state.enemySlots, state.logs]);

  const addFloatingText = (x: number, y: number, text: string, color: string, centered = false) => {
      const id = Math.random().toString(36).substr(2, 9);
      setFloatingTexts(prev => [...prev, { id, x, y, text, color, centered }]);
  };

  const removeFloatingText = (id: string) => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
  };

  const checkStealthBlock = (monsterId: string): boolean => {
      const monsterIdx = state.enemySlots.findIndex(c => c?.id === monsterId);
      if (monsterIdx === -1) return false;
      const monster = state.enemySlots[monsterIdx];
      if (!monster || monster.type !== 'monster' || monster.ability !== 'stealth') return false;

      // Check if ANY other non-stealth monster exists.
      const otherMonsters = state.enemySlots.filter(c => c?.type === 'monster' && c.id !== monsterId && c.ability !== 'stealth');
      if (otherMonsters.length > 0) {
          const slotEl = slotRefs.current[monsterIdx];
          if (slotEl) {
              const rect = slotEl.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top;
              addFloatingText(x, y, '👻 СКРЫТ', 'text-stone-400 font-bold text-lg md:text-xl drop-shadow-md z-[100] tracking-wider animate-bounce', true);
          }
          return true;
      }
      return false;
  };

  const isStealthBlocked = (card: Card) => {
      if (card.type !== 'monster' || card.ability !== 'stealth') return false;
      const otherMonsters = state.enemySlots.filter(c => c?.type === 'monster' && c.id !== card.id && c.ability !== 'stealth');
      return otherMonsters.length > 0;
  };

  const handleDropToHand = (hand: 'left' | 'right' | 'backpack') => (item: any) => {
     const targetCard = hand === 'left' ? state.leftHand.card 
                      : hand === 'right' ? state.rightHand.card 
                      : state.backpack;

     if (!targetCard) {
         dispatch({ type: 'TAKE_CARD_TO_HAND', cardId: item.id, hand });
     } else {
         if (item.type === 'spell') {
             dispatch({ 
                 type: 'USE_SPELL_ON_TARGET', 
                 spellCardId: item.id, 
                 targetId: targetCard.id 
             });
         }
     }
  };

  const isSellBlocked = state.enemySlots.some(card => 
      card && card.type === 'monster' && card.ability === 'scream'
  );
  
  const hasRot = state.enemySlots.some(card => 
      card && card.type === 'monster' && card.ability === 'rot'
  );

  const hasWeb = state.enemySlots.some(card => 
      card && card.type === 'monster' && card.ability === 'web'
  );

  const handleSellDrop = (item: any) => {
     if (isSellBlocked) {
         return;
     }
     // Now just dispatch SELL_ITEM with cardId, reducer handles location
     dispatch({ type: 'SELL_ITEM', cardId: item.id });
  };
  
  const handleMonsterInteraction = (target: 'player' | 'shield_left' | 'shield_right' | 'weapon_left' | 'weapon_right') => (item: any) => {
      if (item.type === 'monster') {
          // Check Stealth Block for Monster -> Interaction (Now completely blocked)
          if (checkStealthBlock(item.id)) {
              return;
          }

          dispatch({ 
              type: 'INTERACT_WITH_MONSTER', 
              monsterId: item.id, 
              target 
          });
      } else if (item.type === 'spell' && target === 'player') {
          dispatch({ 
              type: 'USE_SPELL_ON_TARGET', 
              spellCardId: item.id, 
              targetId: 'player' 
          });
      }
  };
  
  const handleDropOnEnemy = (item: any, targetId: string) => {
      if (item.type === 'spell') {
          // Check Stealth Block for Spell -> Monster interaction
          if (checkStealthBlock(targetId)) {
              return;
          }
          
          dispatch({ 
              type: 'USE_SPELL_ON_TARGET', 
              spellCardId: item.id, 
              targetId: targetId 
          });
      } else if (item.type === 'weapon') {
          // Check Stealth Block for Weapon -> Monster interaction
          if (checkStealthBlock(targetId)) {
              return;
          }

          // Find weapon location
          let handSide: 'left' | 'right' | null = null;
          if (state.leftHand.card?.id === item.id) handSide = 'left';
          else if (state.rightHand.card?.id === item.id) handSide = 'right';

          if (handSide) {
             dispatch({ 
                 type: 'INTERACT_WITH_MONSTER', 
                 monsterId: targetId,
                 target: handSide === 'left' ? 'weapon_left' : 'weapon_right'
             });
          }
      }
  }

  const handleReset = () => {
      dispatch({ type: 'RESET_HAND' }); 
  }

  const handleCardClick = (card: Card) => {
      if (card.type === 'spell' || (card.type === 'monster' && card.ability)) {
          setSelectedCard(card);
      }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full min-h-screen bg-[#141211] flex flex-col p-2 md:p-4 overflow-hidden select-none"
    >
       <FloatingTextOverlay items={floatingTexts} onComplete={removeFloatingText} />

       {/* Backgrounds */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/20 via-stone-950/80 to-stone-950 pointer-events-none z-0"></div>
       <div className="absolute inset-0 flex justify-between opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(90deg, transparent 49%, #000 50%, transparent 51%)', backgroundSize: '12.5% 100%' }}></div>

      {/* --- Top Panel --- */}
      <div className="flex justify-between items-center z-10 w-full px-2 md:px-4 pt-2 md:pt-4">
        <div className="flex items-center gap-4 md:gap-8">
            {/* --- Logo Button --- */}
            <button 
                onClick={() => setShowExitConfirm(true)}
                className="group relative px-2 py-1"
            >
                 <span className="relative z-10 font-display font-bold text-2xl md:text-3xl text-stone-200 tracking-tighter uppercase drop-shadow-lg group-hover:text-rose-500 transition-colors">
                     Skazmor
                 </span>
            </button>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 px-4 py-2 bg-stone-900/90 border border-stone-700 rounded shadow-lg backdrop-blur-sm">
                  <span className="font-bold text-stone-400 text-base tracking-widest font-sans">ОСТАЛОСЬ</span>
                  <div className="w-px h-4 bg-stone-700"></div>
                  <span className="font-mono font-bold text-stone-100 text-base">{state.deck.length}</span>
                </div>

                {/* Deck Stats Breakdown */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 'auto' }}
                            exit={{ opacity: 0, x: -10, width: 0 }}
                            className="flex gap-1.5 overflow-hidden"
                        >
                            <DeckStatItem icon="🐺" count={deckStats.monster} color="text-rose-400" />
                            <DeckStatItem icon="💎" count={deckStats.coin} color="text-amber-400" />
                            <DeckStatItem icon="🧪" count={deckStats.potion} color="text-emerald-400" />
                            <DeckStatItem icon="🛡️" count={deckStats.shield} color="text-stone-300" />
                            <DeckStatItem icon="⚔️" count={deckStats.weapon} color="text-stone-300" />
                            <DeckStatItem icon="📜" count={deckStats.spell} color="text-indigo-400" />
                            {deckStats.skull > 0 && <DeckStatItem icon="💀" count={deckStats.skull} color="text-stone-500" />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      {/* --- Main Game Area --- */}
      <div className="flex-1 flex items-center justify-center w-full z-10 gap-2 md:gap-8 relative px-2 md:px-4">
        
        {/* Left Side: Reset Button */}
        <div className="flex items-center justify-center w-20 md:w-32">
            <button 
              className={`group flex flex-col items-center gap-1 active:scale-95 transition-transform scale-75 md:scale-100 ${state.player.hp <= 5 ? 'opacity-50 pointer-events-none grayscale' : ''}`}
              onClick={handleReset}
            >
                <div className="relative">
                    <div className="w-14 h-16 bg-stone-800/80 border border-stone-600 rounded-b-3xl rounded-t-sm flex items-center justify-center text-3xl group-hover:bg-stone-700 transition-colors shadow-lg">
                        🛡️
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                        <div className="w-0.5 h-full bg-stone-950 rotate-12"></div>
                    </div>
                </div>
                <span className="text-xs font-bold tracking-widest text-stone-400 group-hover:text-stone-200 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm uppercase">Сброс (-5HP)</span>
            </button>
        </div>

        {/* Center: The Grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 w-full max-w-sm md:max-w-xl aspect-[2/1] transition-all duration-300">
          
          {/* Enemy Row */}
          {state.enemySlots.map((card, i) => (
             <div 
                key={`enemy-slot-${i}`} 
                className="aspect-square flex items-center justify-center relative"
                ref={el => slotRefs.current[i] = el}
             >
                {/* Static Placeholder Background */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-stone-800/50 bg-stone-900/20 backdrop-blur-sm" />
                
                <EnemySlotDropZone card={card} onDropOnEnemy={handleDropOnEnemy}>
                    {/* Default mode (sync) allows exiting and entering cards to exist together. Absolute positioning handles overlap. */}
                    <AnimatePresence>
                        {card && (
                           <CardComponent 
                                key={card.id}
                                card={card} 
                                isDraggable={true} 
                                onClick={() => handleCardClick(card)}
                                isBlocked={isStealthBlocked(card)}
                                penalty={hasRot && card.type === 'potion' ? -2 : 0}
                           /> 
                        )}
                    </AnimatePresence>
                </EnemySlotDropZone>
             </div>
          ))}

          {/* Left Hand */}
          <InteractionZone 
              onDrop={() => {}} // Interaction now handled by Slot inner logic
              accepts={[]} 
              className="relative"
          >
              <div ref={leftHandRef} className="w-full h-full">
                  <Slot 
                      card={state.leftHand.card} 
                      onDrop={handleDropToHand('left')} 
                      accepts={['card']} 
                      placeholderIcon="✋" 
                      isBlocked={state.leftHand.blocked}
                      canDropItem={(item) => item.type !== 'monster'}
                      // FIX: Only pass interaction handler if card is a SHIELD
                      onInteract={state.leftHand.card?.type === 'shield' ? handleMonsterInteraction('shield_left') : undefined}
                      onCardClick={() => state.leftHand.card && handleCardClick(state.leftHand.card)}
                      penalty={hasRot && state.leftHand.card?.type === 'potion' ? -2 : 0}
                  />
              </div>
          </InteractionZone>
          
          {/* Player Avatar */}
          <InteractionZone 
              onDrop={handleMonsterInteraction('player')} 
              accepts={[ItemTypes.CARD]}
              className="relative aspect-square"
          >
             <div ref={heroRef} className={`w-full h-full rounded-full border-2 md:border-4 border-stone-400 bg-stone-800 flex items-center justify-center text-4xl md:text-6xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden transition-all ${heroShake ? 'animate-shake ring-4 ring-rose-500' : ''} ${armorFlash ? 'ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)] brightness-110 scale-105' : ''} ${healFlash ? 'ring-4 ring-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.6)] brightness-110 scale-105' : ''}`}>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rose-900/50 to-transparent transition-all duration-500" style={{ height: `${(state.player.hp / state.player.maxHp) * 100}%` }}></div>
                🧙‍♂️
             </div>
             {/* Active Buffs Icons */}
             <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center z-30 pointer-events-none">
                 {activeBuffs.map((effect, i) => {
                     const spell = SPELLS.find(s => s.id === effect);
                     return spell ? (
                         <div key={`${effect}-${i}`} className="w-5 h-5 md:w-6 md:h-6 bg-indigo-900/80 border border-indigo-400/50 rounded-full flex items-center justify-center text-[10px] md:text-xs shadow-sm backdrop-blur-[1px]">
                             {spell.icon}
                         </div>
                     ) : null;
                 })}
             </div>
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 bg-green-900 border-2 border-green-500 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-green-100 z-20 shadow-md">
                {state.player.hp}
             </div>
             <div className={`absolute top-1/2 -right-2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 bg-stone-700 border border-stone-500 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-stone-300 z-20 shadow-md transition-all duration-300 ${coinPulse ? 'scale-125 ring-2 ring-amber-400 bg-amber-900/50' : ''}`}>
                {state.player.coins}
             </div>
          </InteractionZone>

          {/* Right Hand */}
          <InteractionZone 
              onDrop={() => {}} 
              accepts={[]}
              className="relative"
          >
              <div ref={rightHandRef} className="w-full h-full">
                  <Slot 
                      card={state.rightHand.card} 
                      onDrop={handleDropToHand('right')} 
                      accepts={['card']} 
                      placeholderIcon="✋" 
                      isBlocked={state.rightHand.blocked}
                      canDropItem={(item) => item.type !== 'monster'}
                      // FIX: Only pass interaction handler if card is a SHIELD
                      onInteract={state.rightHand.card?.type === 'shield' ? handleMonsterInteraction('shield_right') : undefined}
                      onCardClick={() => state.rightHand.card && handleCardClick(state.rightHand.card)}
                      penalty={hasRot && state.rightHand.card?.type === 'potion' ? -2 : 0}
                  />
              </div>
          </InteractionZone>

          {/* Backpack */}
          <div className="relative" ref={backpackRef}>
              <Slot 
                  card={state.backpack} 
                  onDrop={handleDropToHand('backpack')} 
                  accepts={['card']} 
                  placeholderIcon="🎒"
                  isBlocked={hasWeb}
                  canDropItem={(item) => item.type !== 'monster'}
                  onCardClick={() => state.backpack && handleCardClick(state.backpack)}
                  penalty={hasRot && state.backpack?.type === 'potion' ? -2 : 0}
              />
              {hasWeb && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <span className="text-4xl md:text-5xl drop-shadow-lg opacity-90 filter brightness-125">🕸️</span>
                  </div>
              )}
          </div>

          </div>

        {/* Right Side: Sell Button */}
        <div className="flex items-center justify-center w-20 md:w-32">
            <SellZone onSell={handleSellDrop}>
              <button 
                className={`group flex flex-col items-center gap-1 active:scale-95 transition-transform scale-75 md:scale-100 ${isSellBlocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                disabled={isSellBlocked}
              >
                 <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-900/20 border-2 border-rose-500/50 flex items-center justify-center text-xl md:text-3xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all ${!isSellBlocked ? 'group-hover:bg-rose-900/40 group-hover:border-rose-400' : ''}`}>
                   {isSellBlocked ? '🔒' : '💎'}
                 </div>
                 <span className="min-w-[70px] text-center text-[10px] md:text-xs font-bold tracking-widest text-rose-300 group-hover:text-rose-200 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm uppercase">
                    {isSellBlocked ? 'БЛОК' : 'Продать'}
                 </span>
              </button>
            </SellZone>
        </div>

      </div>

      {/* --- Bottom Panel and Overlays --- */}
      <div className="flex gap-3 md:gap-6 items-end justify-start z-10 w-full px-4 md:px-6 pb-6 md:pb-8">
         <SystemButton 
            icon={<Flag size={20} />} 
            label="New Game" 
            onClick={() => setShowRestartConfirm(true)} 
            danger={true}
         />
         <SystemButton 
            icon={<RefreshCw size={20} />} 
            label="2x" 
         />
         <SystemButton 
            icon={<Search size={20} />} 
            label="Info" 
            active={showInfo}
            onClick={() => setShowInfo(!showInfo)} 
         />
      </div>

      {/* Game Log Window & Overhead Stats */}
      <AnimatePresence>
          {showInfo && (
              <>
                 <OverheadStatsWindow overheads={state.overheads} />
                 <GameLogWindow logs={state.logs} />
              </>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {selectedCard && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={() => setSelectedCard(null)}
              >
                  <div className="bg-stone-800 border-2 border-stone-600 rounded-lg p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                      <button 
                          onClick={() => setSelectedCard(null)}
                          className="absolute top-2 right-2 text-stone-400 hover:text-white"
                      >
                          <X size={20} />
                      </button>
                      <div className="flex flex-col items-center gap-4">
                          <div className="text-6xl relative">
                              {selectedCard.icon}
                              {selectedCard.type === 'monster' && selectedCard.ability && (
                                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-stone-900 border border-stone-600 rounded-full flex items-center justify-center text-xl shadow-lg">
                                       {MONSTER_ABILITIES.find(a => a.id === selectedCard.ability)?.icon}
                                  </div>
                              )}
                          </div>
                          <h3 className="text-xl font-bold text-stone-100">{selectedCard.name || 'Карта'}</h3>
                          <p className="text-stone-300 text-center text-sm leading-relaxed">
                              {selectedCard.description || 'Описание отсутствует.'}
                          </p>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>

      <AnimatePresence>
          {showRestartConfirm && (
              <ConfirmationModal 
                  title="Новая игра" 
                  message="Вы уверены, что хотите начать заново? Текущий прогресс будет потерян."
                  onConfirm={() => {
                      dispatch({ 
                          type: 'START_GAME',
                          deckConfig,
                          runType,
                          templateName
                      });
                      setShowRestartConfirm(false);
                  }}
                  onCancel={() => setShowRestartConfirm(false)}
              />
          )}
      </AnimatePresence>

      <AnimatePresence>
          {showExitConfirm && (
              <ConfirmationModal 
                  title="Выход в меню" 
                  message="Вы уверены, что хотите выйти? Текущий прогресс игры будет потерян."
                  onConfirm={onExit}
                  onCancel={() => setShowExitConfirm(false)}
              />
          )}
      </AnimatePresence>

      <AnimatePresence>
          {state.peekCards && (
              <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 md:top-24 left-0 w-full z-[100] flex justify-center pointer-events-none"
              >
                  <div className={`
                      backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2
                      ${state.peekType === 'beacon' ? 'bg-rose-900/90 border-rose-500/50' : 
                        state.peekType === 'whisper' ? 'bg-stone-900/90 border-indigo-500/30' : 
                        'bg-stone-900/90 border-indigo-500/30'}
                  `}>
                      <div className={`text-[10px] font-bold tracking-[0.2em] uppercase ${state.peekType === 'beacon' ? 'text-rose-200' : 'text-indigo-300'}`}>
                          {state.peekType === 'whisper' ? 'ШЕПОТ ЛЕСА' : 
                           state.peekType === 'beacon' ? 'МАЯК' : 
                           'СЛЕДУЮЩИЕ КАРТЫ'}
                      </div>
                      <div className="flex gap-3">
                          {state.peekCards.map((card, i) => (
                              <motion.div
                                  key={card.id}
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                                  className="w-12 h-12 md:w-14 md:h-14 relative"
                              >
                                  <CardComponent card={card} isDraggable={false} />
                              </motion.div>
                          ))}
                          {state.peekCards.length === 0 && (
                              <p className="text-stone-500 text-xs font-bold uppercase px-2">Колода пуста</p>
                          )}
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {state.scoutCards && (
              <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 md:top-24 left-0 w-full z-[100] flex justify-center pointer-events-none"
              >
                  <div className="bg-stone-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2">
                      <div className="text-[10px] font-bold text-amber-300 tracking-[0.2em] uppercase">
                          РАЗВЕДКА
                      </div>
                      <div className="flex gap-3 relative min-h-[56px] min-w-[120px] justify-center">
                          {state.scoutCards.map((card, i) => (
                              <motion.div
                                  key={card.id + '_scout'}
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={
                                      i === 0 // Top card (to be discarded)
                                      ? { 
                                          opacity: [0, 1, 1, 0], 
                                          scale: [0.5, 1, 1, 0.5],
                                          x: [0, 0, 0, 100],
                                          y: [0, 0, 0, 50],
                                          rotate: [0, 0, 0, 45]
                                        }
                                      : { opacity: 1, scale: 1 } // Second card (stays)
                                  }
                                  transition={
                                      i === 0 
                                      ? { duration: 2.5, times: [0, 0.2, 0.6, 1], ease: "easeInOut" }
                                      : { delay: 0.1, type: "spring", stiffness: 300, damping: 25 }
                                  }
                                  className="w-12 h-12 md:w-14 md:h-14 relative"
                              >
                                  <CardComponent card={card} isDraggable={false} />
                                  {i === 0 && (
                                       <motion.div 
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.5 }}
                                          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"
                                       >
                                           <span className="text-xl">🗑️</span>
                                       </motion.div>
                                  )}
                              </motion.div>
                          ))}
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {(state.status === 'lost' || state.status === 'won') && (
          <GameStatsOverlay 
              stats={state.stats} 
              status={state.status} 
              playerHp={state.player.hp}
              onRestart={() => dispatch({ 
                  type: 'START_GAME',
                  deckConfig,
                  runType,
                  templateName
              })}
              onExit={onExit}
          />
      )}
    </motion.div>
  );
};

const SystemButton = ({ icon, label, onClick, danger = false, active = false }: { icon: React.ReactNode, label: string, onClick?: () => void, danger?: boolean, active?: boolean }) => (
    <button 
        onClick={onClick}
        className={`
            relative group flex items-center gap-3 px-5 py-3 
            backdrop-blur-md border 
            rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 
            transition-all duration-200 overflow-hidden
            ${active ? 'bg-indigo-900/60 border-indigo-500' : 'bg-stone-900/80 border-stone-700'}
            ${danger ? 'hover:border-rose-500/50' : 'hover:border-indigo-500/50'}
        `}
    >
        <div className={`
            absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
            bg-gradient-to-r ${danger ? 'from-rose-900/20 to-transparent' : 'from-indigo-900/20 to-transparent'}
        `}></div>
        
        <div className={`
            ${active ? 'text-indigo-200' : 'text-stone-400'}
            ${danger ? 'group-hover:text-rose-400' : 'group-hover:text-indigo-300'} 
            transition-colors
        `}>
            {icon}
        </div>
        <span className={`
            text-[10px] md:text-xs font-bold tracking-widest uppercase
            ${active ? 'text-indigo-100' : 'text-stone-500'}
            ${danger ? 'group-hover:text-rose-200' : 'group-hover:text-stone-200'} 
            transition-colors
        `}>
            {label}
        </span>
    </button>
)

export default GameScreen;
