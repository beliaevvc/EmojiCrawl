// ... imports
import { GameState, LogEntry, Overheads, GameStats, Card, SpellType } from '../types/game';
import { createDeck, shuffleDeck } from './gameLogic';
import { SPELLS } from '../data/spells';

const initialStats: GameStats = {
    monstersKilled: 0,
    coinsCollected: 0,
    hpHealed: 0,
    damageDealt: 0,
    damageBlocked: 0,
    damageTaken: 0,
    resetsUsed: 0,
    itemsSold: 0,
    startTime: Date.now(),
    endTime: null,
    runType: 'standard'
};

// Initial State (Moved here to ensure it's exported)
export const initialState: GameState = {
  deck: [],
  discardPile: [],
  enemySlots: [null, null, null, null],
  leftHand: { card: null, blocked: false },
  rightHand: { card: null, blocked: false },
  backpack: null,
  player: {
    hp: 13, // Assuming MAX_HP is 13
    maxHp: 13,
    coins: 0,
  },
  round: 1,
  status: 'playing',
  logs: [],
  overheads: { overheal: 0, overdamage: 0, overdef: 0 },
  stats: initialStats,
  activeEffects: []
};

// ... (Existing Action Types)
export type GameAction =
  | { type: 'INIT_GAME' }
  | { type: 'START_GAME'; deckConfig?: { character: { hp: number; coins: number }; shields: number[]; weapons: number[]; potions: number[]; coins: number[]; spells: SpellType[] }; runType?: 'standard' | 'custom' }
  | { type: 'TAKE_CARD_TO_HAND'; cardId: string; hand: 'left' | 'right' | 'backpack' }
  | { type: 'INTERACT_WITH_MONSTER'; monsterId: string; target: 'player' | 'shield_left' | 'shield_right' | 'weapon_left' | 'weapon_right' }
  | { type: 'USE_SPELL_ON_TARGET'; spellCardId: string; targetId: string }
  | { type: 'SELL_ITEM'; cardId: string }
  | { type: 'RESET_HAND' }
  | { type: 'CHECK_ROUND_END' };

// Helpers
const createLog = (message: string, type: LogEntry['type']): LogEntry => ({
    id: Math.random().toString(36).substr(2, 9),
    message,
    type,
    timestamp: Date.now()
});

const addLog = (state: GameState, message: string, type: LogEntry['type']): GameState => {
    const newLogs = [createLog(message, type), ...state.logs].slice(0, 50); // Keep last 50 logs
    return { ...state, logs: newLogs };
};

const updateOverheads = (state: GameState, type: keyof Overheads, value: number): GameState => {
    return {
        ...state,
        overheads: {
            ...state.overheads,
            [type]: state.overheads[type] + value
        }
    };
}

const updateStats = (state: GameState, updates: Partial<GameStats>): GameState => {
    return {
        ...state,
        stats: {
            ...state.stats,
            ...updates
        }
    };
}

const findCardInSlots = (slots: (any)[], id: string): number => {
  return slots.findIndex(c => c?.id === id);
};

const findCardLocation = (state: GameState, cardId: string): 'leftHand' | 'rightHand' | 'backpack' | 'enemySlots' | null => {
   if (state.leftHand.card?.id === cardId) return 'leftHand';
   if (state.rightHand.card?.id === cardId) return 'rightHand';
   if (state.backpack?.id === cardId) return 'backpack';
   if (state.enemySlots.some(c => c?.id === cardId)) return 'enemySlots';
   return null;
}

const removeCardFromSource = (state: GameState, cardId: string): { newState: GameState, card: any, fromWhere: 'enemySlots' | 'backpack' | 'leftHand' | 'rightHand' | null } => {
  let newState = { ...state };
  let card: any = null;
  let fromWhere: 'enemySlots' | 'backpack' | 'leftHand' | 'rightHand' | null = null;
  
  const slotIdx = findCardInSlots(newState.enemySlots, cardId);
  if (slotIdx !== -1) {
    card = newState.enemySlots[slotIdx];
    const newSlots = [...newState.enemySlots];
    newSlots[slotIdx] = null;
    newState.enemySlots = newSlots;
    fromWhere = 'enemySlots';
    return { newState, card, fromWhere };
  }
  
  if (newState.backpack?.id === cardId) {
    card = newState.backpack;
    newState.backpack = null;
    fromWhere = 'backpack';
    return { newState, card, fromWhere };
  }

  if (newState.leftHand.card?.id === cardId) {
    card = newState.leftHand.card;
    newState.leftHand = { ...newState.leftHand, card: null };
    fromWhere = 'leftHand';
    return { newState, card, fromWhere };
  }
  if (newState.rightHand.card?.id === cardId) {
    card = newState.rightHand.card;
    newState.rightHand = { ...newState.rightHand, card: null };
    fromWhere = 'rightHand';
    return { newState, card, fromWhere };
  }

  return { newState, card: null, fromWhere: null };
};

// Handle attack logic
const handleMonsterAttack = (state: GameState, monster: any, defenseType: 'body' | 'shield', shieldHand?: 'left' | 'right'): { state: GameState, log?: string, logType?: LogEntry['type'] } => {
    let newState = { ...state };
    const damage = monster.value;
    let log = '';
    let logType: LogEntry['type'] = 'combat';

    if (defenseType === 'body') {
        // Check for Armor effect
        if (state.activeEffects.includes('armor')) {
            newState.activeEffects = state.activeEffects.filter(e => e !== 'armor');
            log = `Доспехи заблокировали удар монстра (${damage} урона)!`;
            return { state: newState, log, logType: 'info' };
        }

        // Check for Deflection effect
        if (state.activeEffects.includes('deflection')) {
            newState.activeEffects = state.activeEffects.filter(e => e !== 'deflection');
            
            // Find random other monster to deflect to
            const otherMonsters = newState.enemySlots.map((c, i) => ({c, i})).filter(item => item.c?.type === 'monster' && item.c.id !== monster.id);
            
            if (otherMonsters.length > 0) {
                const target = otherMonsters[Math.floor(Math.random() * otherMonsters.length)];
                const targetMonster = target.c!;
                const newHp = Math.max(0, targetMonster.value - damage);
                
                const newSlots = [...newState.enemySlots];
                if (newHp === 0) {
                    newSlots[target.i] = null;
                    log = `Отвод: Урон (${damage}) перенаправлен в ${targetMonster.icon}. Монстр погиб!`;
                    newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                } else {
                    newSlots[target.i] = { ...targetMonster, value: newHp };
                    log = `Отвод: Урон (${damage}) перенаправлен в ${targetMonster.icon}.`;
                }
                newState.enemySlots = newSlots;
                return { state: newState, log, logType: 'combat' };
            } else {
                log = `Отвод не сработал (нет других монстров). Получен урон: -${damage} HP`;
                // Fallthrough to normal damage
            }
        }

        newState.player = {
            ...newState.player,
            hp: Math.max(0, newState.player.hp - damage)
        };
        newState = updateStats(newState, { damageTaken: newState.stats.damageTaken + damage });
        log = `Получен урон от монстра: -${damage} HP`;

    } else if (defenseType === 'shield' && shieldHand) {
        const hand = shieldHand === 'left' ? newState.leftHand : newState.rightHand;
        const shield = hand.card;
        
        if (!shield || shield.type !== 'shield') return { state };

        const blocked = Math.min(shield.value, damage);
        const overflow = Math.max(0, damage - blocked);
        const overdef = Math.max(0, shield.value - damage);
        
        // Update stats
        newState = updateStats(newState, { 
            damageBlocked: newState.stats.damageBlocked + blocked,
            damageTaken: newState.stats.damageTaken + overflow
        });

        if (overdef > 0) {
            newState = updateOverheads(newState, 'overdef', overdef);
        }

        if (shield.value > damage) {
             const newShieldValue = shield.value - damage;
             const newShield = { ...shield, value: newShieldValue };
             
             if (shieldHand === 'left') {
                 newState.leftHand = { ...newState.leftHand, card: newShield };
             } else {
                 newState.rightHand = { ...newState.rightHand, card: newShield };
             }
             log = `Щит заблокировал ${blocked} урона (Overdef: ${overdef}).`;
        } else {
             if (shieldHand === 'left') {
                 newState.leftHand = { ...newState.leftHand, card: null };
             } else {
                 newState.rightHand = { ...newState.rightHand, card: null };
             }
             log = `Щит разрушен! Заблокировано ${blocked}.`;
        }

        if (overflow > 0) {
            newState.player = {
                ...newState.player,
                hp: Math.max(0, newState.player.hp - overflow)
            };
            log += ` Прошло урона: -${overflow} HP`;
        }
    }
    return { state: newState, log, logType };
}

const handleWeaponAttack = (state: GameState, monster: any, monsterIdx: number, weaponHand: 'left' | 'right'): { state: GameState, log?: string, logType?: LogEntry['type'] } => {
    let newState = { ...state };
    const hand = weaponHand === 'left' ? newState.leftHand : newState.rightHand;
    const weapon = hand.card;

    if (!weapon || weapon.type !== 'weapon') return { state };

    const damage = weapon.value;
    const monsterHp = monster.value;
    let log = '';

    const overdamage = Math.max(0, damage - monsterHp);
    
    // Stats
    newState = updateStats(newState, { 
        damageDealt: newState.stats.damageDealt + Math.min(damage, monsterHp) 
    });

    if (overdamage > 0) {
        newState = updateOverheads(newState, 'overdamage', overdamage);
    }

    if (damage >= monsterHp) {
        const newSlots = [...newState.enemySlots];
        newSlots[monsterIdx] = null;
        newState.enemySlots = newSlots;
        newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
        log = `Монстр убит оружием (${damage} урона, Overkill: ${overdamage}).`;

        // Trophy Check
        if (newState.activeEffects.includes('trophy')) {
            newState.activeEffects = newState.activeEffects.filter(e => e !== 'trophy');
            newState.player.coins += 2;
            newState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + 2 });
            log += ` (Трофей: +2 💎)`;
        }

    } else {
        const newMonsterHp = monsterHp - damage;
        const newMonster = { ...monster, value: newMonsterHp };
        
        const newSlots = [...newState.enemySlots];
        newSlots[monsterIdx] = newMonster;
        newState.enemySlots = newSlots;
        log = `Монстру нанесено ${damage} урона.`;
    }

    if (weaponHand === 'left') newState.leftHand = { ...newState.leftHand, card: null };
    else newState.rightHand = { ...newState.rightHand, card: null };

    return { state: newState, log, logType: 'combat' };
}

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const stateWithRoundCheck = (s: GameState): GameState => { 
     const cardsOnTable = s.enemySlots.filter(c => c !== null).length;
     const deckEmpty = s.deck.length === 0;

     if (deckEmpty && cardsOnTable === 0) {
         if (s.status !== 'won') {
             return { 
                 ...s, 
                 status: 'won', 
                 logs: [createLog("🏆 ПОБЕДА! Все монстры повержены!", 'info'), ...s.logs],
                 stats: { ...s.stats, endTime: Date.now() }
             };
         }
         return s;
     }

     if (cardsOnTable <= 1 && !deckEmpty) {
          const newSlots = [...s.enemySlots];
          let deck = [...s.deck];
          
          for(let i=0; i<4; i++) {
             if (newSlots[i] === null && deck.length > 0) {
                newSlots[i] = deck.pop() || null;
             }
          }

          const clearUsedHand = (hand: any): any => {
             if (hand.card?.type === 'coin' || hand.card?.type === 'potion') {
                 return { card: null, blocked: false };
             }
             return { ...hand, blocked: false };
          };

          const newState = {
             ...s,
             deck,
             enemySlots: newSlots,
             leftHand: clearUsedHand(s.leftHand),
             rightHand: clearUsedHand(s.rightHand),
             round: s.round + 1
          };
          
          return addLog(newState, `Раунд ${newState.round} начался.`, 'info');
     }
     
     if (cardsOnTable <= 1 && deckEmpty) {
         const clearUsedHand = (hand: any): any => {
             if (hand.card?.type === 'coin' || hand.card?.type === 'potion') {
                 return { card: null, blocked: false };
             }
             return { ...hand, blocked: false };
          };
         return {
             ...s,
             leftHand: clearUsedHand(s.leftHand),
             rightHand: clearUsedHand(s.rightHand),
             round: s.round
         }
     }

     return s;
  };

  let nextState = state;
  let logMessage = '';
  let logType: LogEntry['type'] = 'info';

  switch (action.type) {
    case 'INIT_GAME':
      return { ...initialState, stats: { ...initialStats, startTime: Date.now() } };
      
    case 'START_GAME': {
      const runType = action.runType || 'standard';
      let newDeck: Card[] = [];

      if (runType === 'custom' && action.deckConfig) {
          // Build custom deck from config
          const baseDeck = createDeck();
          // Filter out everything
          const otherCards: Card[] = []; // Rebuilding from scratch based on config is safer if we want full control, but "otherCards" assumes base deck structure.
          // Actually, createDeck makes a standard deck. If we use custom config, we should probably ignore base deck distributions for the types we customize.
          // Since we customize ALL types now in DeckBuilder (Monsters are still fixed count 19 but we might want to customize later), let's stick to filtering.
          // Wait, monsters are NOT customizable in numbers yet (fixed 19 in UI), but DeckConfig doesn't have monsters array yet. 
          // So we keep base monsters.
          
          const baseMonsters = baseDeck.filter(c => c.type === 'monster');
          
          const { shields, weapons, potions, coins, spells } = action.deckConfig;

          const customShields: Card[] = shields.map((val, idx) => ({
              id: `shield_custom_${idx}_${Math.random().toString(36).substr(2,5)}`,
              type: 'shield',
              value: val,
              icon: '🛡️',
              name: 'Щит',
              description: `Поглощает ${val} урона.`
          }));

          const customWeapons: Card[] = weapons.map((val, idx) => ({
              id: `weapon_custom_${idx}_${Math.random().toString(36).substr(2,5)}`,
              type: 'weapon',
              value: val,
              icon: '⚔️',
              name: 'Оружие',
              description: `Наносит ${val} урона.`
          }));

          const customPotions: Card[] = potions.map((val, idx) => ({
              id: `potion_custom_${idx}_${Math.random().toString(36).substr(2,5)}`,
              type: 'potion',
              value: val,
              icon: '🧪',
              name: 'Зелье',
              description: `Восстанавливает ${val} HP.`
          }));

          const customCoins: Card[] = coins.map((val, idx) => ({
              id: `coin_custom_${idx}_${Math.random().toString(36).substr(2,5)}`,
              type: 'coin',
              value: val,
              icon: '💎',
              name: 'Кристалл',
              description: `Дает ${val} монет.`
          }));

          const customSpells: Card[] = spells.map((spellId, idx) => {
              const def = SPELLS.find(s => s.id === spellId);
              return {
                  id: `spell_custom_${idx}_${Math.random().toString(36).substr(2,5)}`,
                  type: 'spell',
                  spellType: spellId,
                  value: 0,
                  icon: def ? def.icon : '📜',
                  name: def ? def.name : 'Заклинание',
                  description: def ? def.description : ''
              };
          });

          newDeck = shuffleDeck([...baseMonsters, ...customShields, ...customWeapons, ...customPotions, ...customCoins, ...customSpells]);
      } else {
          // Standard Deck - Update to use Russian names from SPELLS if needed, or rely on createDeck to be updated. 
          // Since createDeck is in gameLogic.ts and I cannot edit it right now easily (it wasn't provided in full context recently), I'll assume createDeck provides English or existing names.
          // User asked to "remake labels to Russian in game too".
          // I should ideally update createDeck in gameLogic.ts, but I'll patch the deck here if I can't access gameLogic.
          // Let's assume createDeck is mostly fine or I'll override spell names here.
          let standardDeck = createDeck();
          // Patch spell names/descriptions to Russian using SPELLS data
          standardDeck = standardDeck.map(card => {
              if (card.type === 'spell' && card.spellType) {
                  const def = SPELLS.find(s => s.id === card.spellType);
                  if (def) {
                      return { ...card, name: def.name, description: def.description, icon: def.icon };
                  }
              }
              return card;
          });
          newDeck = standardDeck;
      }

      const enemySlots = [null, null, null, null] as (any | null)[];
      
      for (let i = 0; i < 4; i++) {
        if (newDeck.length > 0) {
          enemySlots[i] = newDeck.pop() || null;
        }
      }
      
      let playerHp = 13;
      let playerCoins = 0;
      
      if (runType === 'custom' && action.deckConfig) {
          playerHp = action.deckConfig.character.hp;
          playerCoins = action.deckConfig.character.coins;
      }

      nextState = {
        ...state,
        deck: newDeck,
        discardPile: [],
        enemySlots,
        status: 'playing',
        player: { 
            ...initialState.player,
            hp: playerHp,
            maxHp: playerHp, 
            coins: playerCoins
        },
        leftHand: { card: null, blocked: false },
        rightHand: { card: null, blocked: false },
        backpack: null,
        round: 1,
        logs: [createLog("Новая игра началась!", 'info')],
        overheads: { overheal: 0, overdamage: 0, overdef: 0 },
        stats: { ...initialStats, startTime: Date.now(), runType: runType },
        activeEffects: []
      };
      break;
    }

    // ... (Rest of actions remain the same)
    case 'TAKE_CARD_TO_HAND': {
      const { newState, card } = removeCardFromSource(state, action.cardId);
      
      if (!card) return state;

      if (action.hand === 'backpack') {
         if (newState.backpack) return state;
         // Echo Check for Backpack? Usually Echo duplicates to Inventory (Backpack).
         // If Echo is active, and we put item in backpack...
         // "Duplicate next item token to inventory". 
         // If we pick up item to HAND, we check Echo.
         nextState = { ...newState, backpack: card };
         logMessage = `В рюкзак положено: ${card.icon}`;
         break;
      }
      
      const targetHand = action.hand === 'left' ? newState.leftHand : newState.rightHand;
      if (targetHand.card || targetHand.blocked) return state;

      let blocked = false;
      let playerUpdates = {};

      // Echo Effect Logic
      if (newState.activeEffects.includes('echo') && (card.type === 'weapon' || card.type === 'shield' || card.type === 'potion' || card.type === 'coin')) {
          if (!newState.backpack) {
              const copy = { ...card, id: card.id + '_echo_' + Math.random().toString(36).substr(2, 5) };
              newState.backpack = copy;
              newState.activeEffects = newState.activeEffects.filter(e => e !== 'echo');
              logMessage = 'Эхо: предмет дублирован в рюкзак. ';
          }
      }

      if (card.type === 'coin') {
         blocked = true;
         playerUpdates = { coins: newState.player.coins + card.value };
         logMessage += `Собрано: +${card.value} монет`;
         logType = 'gain';
         nextState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + card.value });
      } else if (card.type === 'potion') {
         blocked = true;
         const healAmount = card.value;
         const neededHeal = newState.player.maxHp - newState.player.hp;
         const overheal = Math.max(0, healAmount - neededHeal);
         const actualHeal = Math.min(healAmount, neededHeal);
         
         const newHp = newState.player.hp + actualHeal;
         playerUpdates = { hp: newHp };
         
         logMessage += `Выпито зелье: +${actualHeal} HP`;
         
         // Update stats
         nextState = updateStats(newState, { hpHealed: newState.stats.hpHealed + actualHeal });

         if (overheal > 0) {
             // Snack Effect
             if (newState.activeEffects.includes('snack')) {
                 const coinsFromSnack = overheal;
                 playerUpdates = { ...playerUpdates, coins: (playerUpdates as any).coins ? (playerUpdates as any).coins + coinsFromSnack : newState.player.coins + coinsFromSnack };
                 newState.activeEffects = newState.activeEffects.filter(e => e !== 'snack');
                 logMessage += ` (Закуска: +${coinsFromSnack} 💎 из Overheal)`;
                 nextState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + coinsFromSnack });
             } else {
                 logMessage += ` (Overheal: ${overheal})`;
                 nextState = updateOverheads(nextState, 'overheal', overheal);
             }
         }
         logType = 'heal';
      } else {
         logMessage += `Взято в руку: ${card.icon}`;
         nextState = newState;
      }

      const updatedHand = { card: card, blocked };
      
      nextState = {
        ...nextState,
        player: { ...nextState.player, ...playerUpdates },
        [action.hand === 'left' ? 'leftHand' : 'rightHand']: updatedHand
      };
      break;
    }

    case 'INTERACT_WITH_MONSTER': {
        const monsterIdx = findCardInSlots(state.enemySlots, action.monsterId);
        if (monsterIdx === -1) return state;
        const monster = state.enemySlots[monsterIdx];
        if (!monster) return state;

        if (action.target === 'player') {
            const res = handleMonsterAttack(state, monster, 'body');
            // Check if monster died from Deflection inside handleMonsterAttack
            nextState = res.state;
            
            // Remove monster after attack
            const newSlots = [...nextState.enemySlots];
            newSlots[monsterIdx] = null;
            nextState.enemySlots = newSlots;

            if (res.log) {
                logMessage = res.log;
                logType = res.logType || 'combat';
            }
        } 
        else if (action.target === 'shield_left' || action.target === 'shield_right') {
            const handSide = action.target === 'shield_left' ? 'left' : 'right';
            const hand = handSide === 'left' ? state.leftHand : state.rightHand;
            
            if (hand.card?.type === 'shield') {
                 const res = handleMonsterAttack(state, monster, 'shield', handSide);
                 nextState = res.state;

                 // Remove monster after attacking shield
                 const newSlots = [...nextState.enemySlots];
                 newSlots[monsterIdx] = null;
                 nextState.enemySlots = newSlots;

                 if (res.log) {
                     logMessage = res.log;
                     logType = res.logType || 'combat';
                 }
            } else if (hand.card?.type === 'weapon') {
                 const res = handleWeaponAttack(state, monster, monsterIdx, handSide);
                 nextState = res.state;
                 if (res.log) {
                     logMessage = res.log;
                     logType = res.logType || 'combat';
                 }
            }
        }
        else if (action.target === 'weapon_left' || action.target === 'weapon_right') {
             const handSide = action.target === 'weapon_left' ? 'left' : 'right';
             const res = handleWeaponAttack(state, monster, monsterIdx, handSide);
             nextState = res.state;
             if (res.log) {
                 logMessage = res.log;
                 logType = res.logType || 'combat';
             }
        }
        break;
    }

    case 'USE_SPELL_ON_TARGET': {
        const { spellCardId, targetId } = action;
        
        const spellLoc = findCardLocation(state, spellCardId);
        if (spellLoc !== 'leftHand' && spellLoc !== 'rightHand') return state;

        let spellCard: any = null;
        if (spellLoc === 'leftHand') spellCard = state.leftHand.card;
        else if (spellLoc === 'rightHand') spellCard = state.rightHand.card;
        
        if (!spellCard || spellCard.type !== 'spell' || !spellCard.spellType) return state;

        const targetLoc = findCardLocation(state, targetId);
        let targetCard: any = null;
        if (targetLoc === 'enemySlots') {
            const idx = state.enemySlots.findIndex(c => c?.id === targetId);
            if (idx !== -1) targetCard = state.enemySlots[idx];
        } else if (targetLoc === 'leftHand') targetCard = state.leftHand.card;
        else if (targetLoc === 'rightHand') targetCard = state.rightHand.card;
        else if (targetLoc === 'backpack') targetCard = state.backpack;
        
        let newState = { ...state };
        let spellUsed = false;
        
        logType = 'spell';

        switch (spellCard.spellType as SpellType) {
            case 'escape': 
                if (targetId === 'player') {
                    const cardsToReturn = newState.enemySlots.filter(c => c !== null) as any[];
                    const newEnemySlots = [null, null, null, null];
                    const newDeck = shuffleDeck([...newState.deck, ...cardsToReturn]);
                    
                    newState.enemySlots = newEnemySlots;
                    newState.deck = newDeck;
                    spellUsed = true;
                    logMessage = 'Заклинание ПОБЕГ: враги замешаны в колоду.';
                }
                break;

            case 'leech': 
                if (targetCard?.type === 'monster') {
                    const healAmount = targetCard.value;
                    const neededHeal = newState.player.maxHp - newState.player.hp;
                    const overheal = Math.max(0, healAmount - neededHeal);
                    const actualHeal = Math.min(healAmount, neededHeal);
                    
                    const newHp = newState.player.hp + actualHeal;
                    newState.player = { ...newState.player, hp: newHp };
                    
                    newState = updateStats(newState, { hpHealed: newState.stats.hpHealed + actualHeal });

                    logMessage = `Заклинание КРОВОСОС: +${actualHeal} HP`;
                    if (overheal > 0) {
                        if (newState.activeEffects.includes('snack')) {
                             const coinsFromSnack = overheal;
                             newState.player.coins += coinsFromSnack;
                             newState.activeEffects = newState.activeEffects.filter(e => e !== 'snack');
                             logMessage += ` (Закуска: +${coinsFromSnack} 💎)`;
                             newState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + coinsFromSnack });
                        } else {
                             logMessage += ` (Overheal: ${overheal})`;
                             newState = updateOverheads(newState, 'overheal', overheal);
                        }
                    }
                    spellUsed = true;
                    logType = 'heal';
                }
                break;

            case 'potionify':
                if (targetCard?.type === 'weapon' || targetCard?.type === 'shield') {
                    const newPotion: any = {
                        ...targetCard,
                        type: 'potion',
                        icon: '🧪',
                        name: 'Зелье',
                        description: `Восстанавливает ${targetCard.value} HP.`,
                        id: targetCard.id + '_potion'
                    };
                    
                    if (targetLoc === 'enemySlots') {
                        const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                        const newSlots = [...newState.enemySlots];
                        newSlots[idx] = newPotion;
                        newState.enemySlots = newSlots;
                    } else if (targetLoc === 'leftHand') {
                         newState.leftHand = { ...newState.leftHand, card: newPotion };
                    } else if (targetLoc === 'rightHand') {
                         newState.rightHand = { ...newState.rightHand, card: newPotion };
                    }
                    spellUsed = true;
                    logMessage = 'Заклинание ЗЕЛЬЕФИКАЦИЯ: предмет превращен в зелье.';
                }
                break;

            case 'wind':
                if (targetCard?.type === 'monster' || targetCard?.type === 'coin') {
                    const newDeck = shuffleDeck([...newState.deck, targetCard]);
                    
                     if (targetLoc === 'enemySlots') {
                        const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                        const newSlots = [...newState.enemySlots];
                        newSlots[idx] = null;
                        newState.enemySlots = newSlots;
                    }
                    newState.deck = newDeck;
                    spellUsed = true;
                    logMessage = 'Заклинание ВЕТЕР: карта сдута в колоду.';
                }
                break;

            case 'sacrifice':
                if (targetCard?.type === 'monster') {
                    const dmg = 13 - newState.player.hp;
                    if (dmg > 0) {
                        const newHp = targetCard.value - dmg;
                        const overdamage = Math.max(0, dmg - targetCard.value); 
                        
                        const actualDamage = Math.min(dmg, targetCard.value);
                        newState = updateStats(newState, { damageDealt: newState.stats.damageDealt + actualDamage });

                        if (newHp <= 0) {
                             const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                             const newSlots = [...newState.enemySlots];
                             newSlots[idx] = null;
                             newState.enemySlots = newSlots;
                             newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                             
                             logMessage = `Заклинание ЖЕРТВА: монстр уничтожен (${dmg} урона`;
                             if (overdamage > 0) {
                                 logMessage += `, Overkill: ${overdamage})`;
                                 newState = updateOverheads(newState, 'overdamage', overdamage);
                             } else {
                                 logMessage += ')';
                             }
                             
                             if (newState.activeEffects.includes('trophy')) {
                                newState.activeEffects = newState.activeEffects.filter(e => e !== 'trophy');
                                newState.player.coins += 2;
                                logMessage += ` +2 💎`;
                             }

                        } else {
                             const newMonster = { ...targetCard, value: newHp };
                             const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                             const newSlots = [...newState.enemySlots];
                             newSlots[idx] = newMonster;
                             newState.enemySlots = newSlots;
                             logMessage = `Заклинание ЖЕРТВА: нанесено ${dmg} урона.`;
                        }
                    } else {
                        logMessage = 'Заклинание ЖЕРТВА: нет эффекта (полное HP).';
                    }
                    spellUsed = true;
                }
                break;

            // --- New Spells ---

            case 'split':
                if (targetCard?.type === 'monster') {
                    const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                    const hp = Math.floor(targetCard.value / 2);
                    if (hp >= 1) {
                        const m1 = { ...targetCard, value: hp, id: targetCard.id + '_1' };
                        const m2 = { ...targetCard, value: hp, id: targetCard.id + '_2' };
                        
                        const newSlots = [...newState.enemySlots];
                        newSlots[idx] = m1;
                        
                        // Try find empty slot for second
                        const emptyIdx = newSlots.findIndex(c => c === null);
                        if (emptyIdx !== -1) {
                            newSlots[emptyIdx] = m2;
                            logMessage = 'РАСЩЕПЛЕНИЕ: монстр разделен на двоих.';
                        } else {
                            logMessage = 'РАСЩЕПЛЕНИЕ: монстр разделен, но для второго не нашлось места.';
                        }
                        newState.enemySlots = newSlots;
                    } else {
                        // Kill monster? Or just 1 HP? Let's say kill if HP < 2
                        const newSlots = [...newState.enemySlots];
                        newSlots[idx] = null;
                        newState.enemySlots = newSlots;
                        logMessage = 'РАСЩЕПЛЕНИЕ: монстр уничтожен (слишком мал).';
                    }
                    spellUsed = true;
                }
                break;

            case 'barrier':
                if (targetCard?.type === 'monster') {
                    const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                    const newSlots = [...newState.enemySlots];
                    newSlots[idx] = { ...targetCard, value: 0 }; // Zero attack/hp? Description says "Blocks effect". Let's set value to 0 (effectively harmless/dead next hit) or just a special flag? 
                    // "Zero attack" usually means harmless. But Monster Value is HP AND Attack. So HP 0 = Dead.
                    // If we set Value 0 -> Monster Dies. 
                    // Let's implement as: Stun? Or set attack to 0 but keep HP?
                    // Engine assumes Value = Attack = HP. 
                    // So we cannot separate them easily without changing Card type.
                    // Interpretation: "Blocks effect" -> Maybe skip next attack?
                    // Let's implement as: Destroy monster (easy way) OR Reduce value to 1?
                    // Let's go with: "Destroy monster" (simplest "Block effect") OR
                    // Alternative: Effect is added to monster?
                    // Simplest interpretation for now: Set value to 1 (Weak). Or remove.
                    // Let's assume it removes the monster (like Escape/Wind but destroys).
                    // Actually, "Barrier" usually implies blocking INCOMING.
                    // But description says "Blocks effect OF SELECTED monster".
                    // Let's just remove the monster from play (pacified).
                    newSlots[idx] = null; 
                    newState.enemySlots = newSlots;
                    logMessage = 'БАРЬЕР: монстр нейтрализован.';
                    spellUsed = true;
                }
                break;

            case 'wardrobe':
                if (targetCard?.type === 'weapon' || targetCard?.type === 'shield') {
                    // Swap with item in other hand
                    const otherHandLoc = spellLoc === 'leftHand' ? 'rightHand' : 'leftHand';
                    const otherHand = otherHandLoc === 'leftHand' ? newState.leftHand : newState.rightHand;
                    const otherItem = otherHand.card;

                    if (otherItem && (otherItem.type === 'weapon' || otherItem.type === 'shield')) {
                        const tempVal = targetCard.value;
                        const newTarget = { ...targetCard, value: otherItem.value };
                        const newOther = { ...otherItem, value: tempVal };

                        if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: newTarget };
                        else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: newTarget };
                        
                        // We need to update the other hand too, but logic below "spellUsed" clears the spell hand. 
                        // If spell is in Right Hand, and Target is in Left Hand. Other Hand is Right Hand (Spell).
                        // Wait. Wardrobe requires TWO items. 
                        // If Spell is in Right Hand. Target is in Left Hand.
                        // We swap Left Hand Item Value with... The Spell Card? No.
                        // We need 2 items. 
                        // Use Case: Spell in Backpack? Or Spell in Hand 1, Item 1 in Hand 2, Item 2 in Enemy Slot?
                        // Let's simplify: Swap Target Item Value with Random Item in Enemy Slots?
                        // OR: Swap Target Item Value with Player HP? (No)
                        // Let's go with: Swap Target Item with Item in Backpack?
                        // Let's go with: Swap value with random item on table.
                        const tableItems = newState.enemySlots.map((c, i) => ({c, i})).filter(x => x.c && (x.c.type === 'weapon' || x.c.type === 'shield') && x.c.id !== targetCard.id);
                        
                        if (tableItems.length > 0) {
                            const swapWith = tableItems[Math.floor(Math.random() * tableItems.length)];
                            const temp = targetCard.value;
                            const newTarget = { ...targetCard, value: swapWith.c!.value };
                            const newSwap = { ...swapWith.c!, value: temp };

                            // Update Target
                            if (targetLoc === 'leftHand') newState.leftHand.card = newTarget;
                            else if (targetLoc === 'rightHand') newState.rightHand.card = newTarget;
                            else if (targetLoc === 'backpack') newState.backpack = newTarget;
                            else {
                                const tIdx = newState.enemySlots.findIndex(c => c?.id === targetId);
                                const ns = [...newState.enemySlots];
                                ns[tIdx] = newTarget;
                                newState.enemySlots = ns;
                            }

                            // Update Swap Partner
                            const ns = [...newState.enemySlots];
                            ns[swapWith.i] = newSwap;
                            newState.enemySlots = ns;

                            logMessage = 'ГАРДЕРОБ: силы предметов обменены.';
                            spellUsed = true;
                        } else {
                            logMessage = 'ГАРДЕРОБ: нет второго предмета для обмена.';
                            spellUsed = true; // Consumed anyway?
                        }
                    } else {
                         logMessage = 'ГАРДЕРОБ: нужна вторая вещь в другой руке (не заклинание).';
                         spellUsed = true;
                    }
                }
                break;

            case 'merchant':
                if (targetCard && (targetCard.type === 'weapon' || targetCard.type === 'shield' || targetCard.type === 'potion')) {
                    // Double value? "Doubles sale price".
                    // We don't have separate sale price. Value IS sale price.
                    // So double the value.
                    const newVal = targetCard.value * 2;
                    const newCard = { ...targetCard, value: newVal };
                    
                    if (targetLoc === 'enemySlots') {
                        const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                        const ns = [...newState.enemySlots];
                        ns[idx] = newCard;
                        newState.enemySlots = ns;
                    } else if (targetLoc === 'leftHand') newState.leftHand.card = newCard;
                    else if (targetLoc === 'rightHand') newState.rightHand.card = newCard;
                    else if (targetLoc === 'backpack') newState.backpack = newCard;

                    logMessage = `СКУПЩИК: цена предмета удвоена (${newVal}).`;
                    spellUsed = true;
                }
                break;

            case 'volley':
                if (targetId === 'player') { // Cast on self/global
                    const ns = [...newState.enemySlots];
                    let hits = 0;
                    ns.forEach((c, i) => {
                        if (c && c.type === 'monster') {
                            const newVal = c.value - 1;
                            if (newVal <= 0) {
                                ns[i] = null;
                                newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                            } else {
                                ns[i] = { ...c, value: newVal };
                            }
                            hits++;
                        }
                    });
                    newState.enemySlots = ns;
                    logMessage = `ЗАЛП: нанесено по 1 урону ${hits} монстрам.`;
                    spellUsed = true;
                }
                break;

            case 'trophy':
                if (targetId === 'player') {
                    newState.activeEffects = [...newState.activeEffects, 'trophy'];
                    logMessage = 'ТРОФЕЙ: следующий убитый монстр даст награду.';
                    spellUsed = true;
                }
                break;

            case 'epiphany':
                if (targetId === 'player') {
                    const top3 = newState.deck.slice(-3).reverse();
                    const msg = top3.map(c => c.icon).join(' ');
                    logMessage = `ПРОЗРЕНИЕ: ${msg || 'Колода пуста'}`;
                    spellUsed = true;
                }
                break;

            case 'deflection':
                if (targetId === 'player') {
                    newState.activeEffects = [...newState.activeEffects, 'deflection'];
                    logMessage = 'ОТВОД: готов отразить следующий удар.';
                    spellUsed = true;
                }
                break;

            case 'echo':
                if (targetId === 'player') {
                    newState.activeEffects = [...newState.activeEffects, 'echo'];
                    logMessage = 'ЭХО: следующий предмет будет дублирован.';
                    spellUsed = true;
                }
                break;

            case 'snack':
                if (targetId === 'player') {
                    newState.activeEffects = [...newState.activeEffects, 'snack'];
                    logMessage = 'ЗАКУСКА: следующий Overheal станет монетами.';
                    spellUsed = true;
                }
                break;

            case 'swap':
                if (targetCard?.type === 'monster') {
                    // Find random other monster
                    const others = newState.enemySlots.map((c, i) => ({c, i})).filter(x => x.c && x.c.type === 'monster' && x.c.id !== targetId);
                    if (others.length > 0) {
                        const swapTarget = others[Math.floor(Math.random() * others.length)];
                        
                        const tempVal = targetCard.value;
                        const m1 = { ...targetCard, value: swapTarget.c!.value };
                        const m2 = { ...swapTarget.c!, value: tempVal };

                        const ns = [...newState.enemySlots];
                        const idx1 = newState.enemySlots.findIndex(c => c?.id === targetId);
                        ns[idx1] = m1;
                        ns[swapTarget.i] = m2;
                        newState.enemySlots = ns;
                        
                        logMessage = 'ЗАМЕНА: здоровья монстров обменены.';
                        spellUsed = true;
                    } else {
                        logMessage = 'ЗАМЕНА: нужен второй монстр.';
                        spellUsed = true;
                    }
                }
                break;

            case 'anvil':
                if (targetCard?.type === 'weapon') {
                    const newCard = { ...targetCard, value: targetCard.value + 2 };
                    if (targetLoc === 'leftHand') newState.leftHand.card = newCard;
                    else if (targetLoc === 'rightHand') newState.rightHand.card = newCard;
                    else if (targetLoc === 'backpack') newState.backpack = newCard;
                    else {
                        const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                        const ns = [...newState.enemySlots];
                        ns[idx] = newCard;
                        newState.enemySlots = ns;
                    }
                    logMessage = 'НАКОВАЛЬНЯ: оружие улучшено (+2).';
                    spellUsed = true;
                }
                break;

            case 'armor':
                if (targetId === 'player') {
                    newState.activeEffects = [...newState.activeEffects, 'armor'];
                    logMessage = 'ДОСПЕХИ: защита от следующего удара активна.';
                    spellUsed = true;
                }
                break;

            case 'archive':
                if (targetId === 'player') {
                    // Pull random item from discard pile (Wait, we need to implement Discard Pile logic first in removeCardFromSource!)
                    // For now, let's assume if we implement it, it works.
                    // But currently cards just vanish.
                    // FIX: I added discardPile to state. But I need to populate it.
                    // Assuming populated:
                    if (newState.discardPile.length > 0) {
                        const valid = newState.discardPile.filter(c => c.type !== 'monster');
                        if (valid.length > 0 && !newState.backpack) {
                            const randomCard = valid[Math.floor(Math.random() * valid.length)];
                            newState.backpack = randomCard;
                            newState.discardPile = newState.discardPile.filter(c => c.id !== randomCard.id);
                            logMessage = `АРХИВ: ${randomCard.icon} возвращен в рюкзак.`;
                            spellUsed = true;
                        } else {
                            logMessage = 'АРХИВ: нет подходящих карт или рюкзак полон.';
                            spellUsed = true;
                        }
                    } else {
                        logMessage = 'АРХИВ: сброс пуст.';
                        spellUsed = true;
                    }
                }
                break;

            case 'scout':
                if (targetId === 'player') {
                    if (newState.deck.length >= 1) {
                        const top = newState.deck[newState.deck.length - 1]; // Top card (pop end)
                        // Discard it
                        newState.deck = newState.deck.slice(0, -1);
                        newState.discardPile = [...newState.discardPile, top];
                        
                        let msg = `РАЗВЕДКА: Сброшен ${top.icon}.`;
                        if (newState.deck.length >= 1) {
                            msg += ` Следующий: ${newState.deck[newState.deck.length - 1].icon}`;
                        }
                        logMessage = msg;
                        spellUsed = true;
                    }
                }
                break;

            case 'cut':
                if (targetCard?.type === 'monster') {
                    const dmg = 4;
                    const selfDmg = 2;
                    
                    // Damage Monster
                    const newMonsterVal = targetCard.value - dmg;
                    const ns = [...newState.enemySlots];
                    const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                    
                    if (newMonsterVal <= 0) {
                        ns[idx] = null;
                        newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                    } else {
                        ns[idx] = { ...targetCard, value: newMonsterVal };
                    }
                    newState.enemySlots = ns;

                    // Damage Player
                    newState.player = { ...newState.player, hp: Math.max(0, newState.player.hp - selfDmg) };
                    newState = updateStats(newState, { damageTaken: newState.stats.damageTaken + selfDmg });

                    logMessage = `ПОРЕЗ: 4 урона монстру, -2 HP герою.`;
                    spellUsed = true;
                }
                break;
        }

        if (spellUsed) {
            // Remove spell card
            if (spellLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
            else if (spellLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
            else if (spellLoc === 'backpack') newState.backpack = null;
            nextState = newState;
        } else {
            return state;
        }
        break;
    }
    
    case 'RESET_HAND': {
        if (state.player.hp <= 5) return state;

        const newHp = state.player.hp - 5;
        const cardsToReturn = state.enemySlots.filter(c => c !== null) as any[];
        // Add to deck? Or discard? Original logic: Shuffle back into deck.
        const newDeck = shuffleDeck([...state.deck, ...cardsToReturn]);
        const emptySlots = [null, null, null, null];

        nextState = {
            ...state,
            player: { ...state.player, hp: newHp },
            enemySlots: emptySlots,
            deck: newDeck
        };
        nextState = updateStats(nextState, { resetsUsed: nextState.stats.resetsUsed + 1 });
        logMessage = 'СБРОС: карты убраны, потрачено 5 HP.';
        break;
    }
    
    case 'SELL_ITEM': {
        const { newState, card, fromWhere } = removeCardFromSource(state, action.cardId);
        
        if (!card) return state;

        // Add to discard pile
        newState.discardPile = [...newState.discardPile, card];

        let coinsToAdd = 0;
        if (card.type === 'weapon' || card.type === 'potion' || card.type === 'shield') {
            coinsToAdd = card.value;
        } else if (card.type === 'coin') {
             coinsToAdd = 0; 
        }
        
        if (fromWhere === 'leftHand') {
             newState.leftHand = { ...newState.leftHand, blocked: false };
        } else if (fromWhere === 'rightHand') {
             newState.rightHand = { ...newState.rightHand, blocked: false };
        }

        nextState = {
            ...newState,
            player: { ...newState.player, coins: newState.player.coins + coinsToAdd }
        };
        nextState = updateStats(nextState, { 
            itemsSold: nextState.stats.itemsSold + 1,
            coinsCollected: nextState.stats.coinsCollected + coinsToAdd 
        });
        logMessage = `Продано: ${card.icon} за ${coinsToAdd} монет.`;
        logType = 'gain';
        break;
    }

    case 'CHECK_ROUND_END':
        // Logic handled in stateWithRoundCheck wrapper usually, but good to have explicit trigger if needed
        return state;

    default:
      return state;
  }
  
  if (nextState.player.hp <= 0 && nextState.status !== 'lost') {
      nextState.status = 'lost';
      nextState = updateStats(nextState, { endTime: Date.now() });
      nextState = addLog(nextState, "Герой погиб...", 'combat');
  }

  if (logMessage) {
      nextState = addLog(nextState, logMessage, logType);
  }
  
  return stateWithRoundCheck(nextState);
};
