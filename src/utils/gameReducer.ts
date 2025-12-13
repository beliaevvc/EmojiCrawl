// ... imports
import { GameState } from '../types/game';
import { createDeck, shuffleDeck } from './gameLogic';

// Initial State (Moved here to ensure it's exported)
export const initialState: GameState = {
  deck: [],
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
};

// ... (Existing Action Types)
export type GameAction =
  | { type: 'INIT_GAME' }
  | { type: 'START_GAME' }
  | { type: 'TAKE_CARD_TO_HAND'; cardId: string; hand: 'left' | 'right' | 'backpack' }
  | { type: 'INTERACT_WITH_MONSTER'; monsterId: string; target: 'player' | 'shield_left' | 'shield_right' | 'weapon_left' | 'weapon_right' }
  | { type: 'USE_SPELL_ON_TARGET'; spellCardId: string; targetId: string }
  | { type: 'SELL_ITEM'; cardId: string }
  | { type: 'RESET_HAND' }
  | { type: 'CHECK_ROUND_END' };

// ... (Helpers) ...
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

const handleMonsterAttack = (state: GameState, monster: any, defenseType: 'body' | 'shield', shieldHand?: 'left' | 'right'): GameState => {
    let newState = { ...state };
    const damage = monster.value;

    if (defenseType === 'body') {
        newState.player = {
            ...newState.player,
            hp: Math.max(0, newState.player.hp - damage)
        };
    } else if (defenseType === 'shield' && shieldHand) {
        const hand = shieldHand === 'left' ? newState.leftHand : newState.rightHand;
        const shield = hand.card;
        
        if (!shield || shield.type !== 'shield') return state;

        const blocked = Math.min(shield.value, damage);
        const overflow = Math.max(0, damage - blocked);
        
        if (shield.value > damage) {
             const newShieldValue = shield.value - damage;
             const newShield = { ...shield, value: newShieldValue };
             
             if (shieldHand === 'left') {
                 newState.leftHand = { ...newState.leftHand, card: newShield };
             } else {
                 newState.rightHand = { ...newState.rightHand, card: newShield };
             }
        } else {
             if (shieldHand === 'left') {
                 newState.leftHand = { ...newState.leftHand, card: null };
             } else {
                 newState.rightHand = { ...newState.rightHand, card: null };
             }
        }

        if (overflow > 0) {
            newState.player = {
                ...newState.player,
                hp: Math.max(0, newState.player.hp - overflow)
            };
        }
    }
    return newState;
}

const handleWeaponAttack = (state: GameState, monster: any, monsterIdx: number, weaponHand: 'left' | 'right'): GameState => {
    let newState = { ...state };
    const hand = weaponHand === 'left' ? newState.leftHand : newState.rightHand;
    const weapon = hand.card;

    if (!weapon || weapon.type !== 'weapon') return state;

    const damage = weapon.value;
    const monsterHp = monster.value;

    if (damage >= monsterHp) {
        const newSlots = [...newState.enemySlots];
        newSlots[monsterIdx] = null;
        newState.enemySlots = newSlots;
    } else {
        const newMonsterHp = monsterHp - damage;
        const newMonster = { ...monster, value: newMonsterHp };
        
        const newSlots = [...newState.enemySlots];
        newSlots[monsterIdx] = newMonster;
        newState.enemySlots = newSlots;
    }

    if (weaponHand === 'left') newState.leftHand = { ...newState.leftHand, card: null };
    else newState.rightHand = { ...newState.rightHand, card: null };

    return newState;
}

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const stateWithRoundCheck = (s: GameState): GameState => { 
     const cardsOnTable = s.enemySlots.filter(c => c !== null).length;
     const deckEmpty = s.deck.length === 0;

     if (deckEmpty && cardsOnTable === 0) {
         return { ...s, status: 'won' };
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

          return {
             ...s,
             deck,
             enemySlots: newSlots,
             leftHand: clearUsedHand(s.leftHand),
             rightHand: clearUsedHand(s.rightHand),
             round: s.round + 1
          };
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

  switch (action.type) {
    case 'INIT_GAME':
      return { ...initialState };
      
    case 'START_GAME': {
      const newDeck = createDeck();
      const enemySlots = [null, null, null, null] as (any | null)[];
      
      for (let i = 0; i < 4; i++) {
        if (newDeck.length > 0) {
          enemySlots[i] = newDeck.pop() || null;
        }
      }
      
      nextState = {
        ...state,
        deck: newDeck,
        enemySlots,
        status: 'playing',
        player: { ...initialState.player },
        leftHand: { card: null, blocked: false },
        rightHand: { card: null, blocked: false },
        backpack: null,
        round: 1
      };
      break;
    }

    case 'TAKE_CARD_TO_HAND': {
      const { newState, card } = removeCardFromSource(state, action.cardId); // Fixed: removed unused fromWhere
      
      if (!card) return state;

      if (action.hand === 'backpack') {
         if (newState.backpack) return state;
         nextState = { ...newState, backpack: card };
         break;
      }
      
      const targetHand = action.hand === 'left' ? newState.leftHand : newState.rightHand;
      if (targetHand.card || targetHand.blocked) return state;

      let blocked = false;
      let playerUpdates = {};

      if (card.type === 'coin') {
         blocked = true;
         playerUpdates = { coins: newState.player.coins + card.value };
      } else if (card.type === 'potion') {
         blocked = true;
         const healAmount = card.value;
         const newHp = Math.min(newState.player.hp + healAmount, newState.player.maxHp);
         playerUpdates = { hp: newHp };
      }

      const updatedHand = { card: card, blocked };
      
      nextState = {
        ...newState,
        player: { ...newState.player, ...playerUpdates },
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
            const dmg = monster.value;
            const newHp = Math.max(0, state.player.hp - dmg);
            
            const newSlots = [...state.enemySlots];
            newSlots[monsterIdx] = null;

            nextState = {
                ...state,
                enemySlots: newSlots,
                player: { ...state.player, hp: newHp }
            };
        } 
        else if (action.target === 'shield_left' || action.target === 'shield_right') {
            const handSide = action.target === 'shield_left' ? 'left' : 'right';
            const hand = handSide === 'left' ? state.leftHand : state.rightHand;
            
            if (hand.card?.type === 'shield') {
                 const stateAfterDef = handleMonsterAttack(state, monster, 'shield', handSide);
                 const newSlots = [...stateAfterDef.enemySlots];
                 newSlots[monsterIdx] = null; 
                 nextState = { ...stateAfterDef, enemySlots: newSlots };
            } else if (hand.card?.type === 'weapon') {
                 nextState = handleWeaponAttack(state, monster, monsterIdx, handSide);
            }
        }
        else if (action.target === 'weapon_left' || action.target === 'weapon_right') {
             const handSide = action.target === 'weapon_left' ? 'left' : 'right';
             nextState = handleWeaponAttack(state, monster, monsterIdx, handSide);
        }
        break;
    }

    case 'USE_SPELL_ON_TARGET': {
        const { spellCardId, targetId } = action;
        
        const spellLoc = findCardLocation(state, spellCardId);
        let spellCard: any = null;
        if (spellLoc === 'leftHand') spellCard = state.leftHand.card;
        else if (spellLoc === 'rightHand') spellCard = state.rightHand.card;
        else if (spellLoc === 'backpack') spellCard = state.backpack;
        
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

        switch (spellCard.spellType) {
            case 'escape': 
                if (targetCard?.type === 'monster') {
                    const monsters = newState.enemySlots.filter(c => c?.type === 'monster') as any[];
                    const newEnemySlots = newState.enemySlots.map(c => c?.type === 'monster' ? null : c);
                    const newDeck = shuffleDeck([...newState.deck, ...monsters]);
                    newState.enemySlots = newEnemySlots;
                    newState.deck = newDeck;
                    spellUsed = true;
                }
                break;

            case 'leech': 
                if (targetCard?.type === 'monster') {
                    const healAmount = targetCard.value;
                    const newHp = Math.min(newState.player.hp + healAmount, newState.player.maxHp);
                    newState.player = { ...newState.player, hp: newHp };
                    spellUsed = true;
                }
                break;

            case 'potionify':
                if (targetCard?.type === 'weapon' || targetCard?.type === 'shield') {
                    const newPotion: any = {
                        ...targetCard,
                        type: 'potion',
                        icon: '🧪',
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
                }
                break;

            case 'sacrifice':
                if (targetCard?.type === 'monster') {
                    const dmg = 13 - newState.player.hp;
                    if (dmg > 0) {
                        const newHp = targetCard.value - dmg;
                        if (newHp <= 0) {
                             const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                             const newSlots = [...newState.enemySlots];
                             newSlots[idx] = null;
                             newState.enemySlots = newSlots;
                        } else {
                             const newMonster = { ...targetCard, value: newHp };
                             const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                             const newSlots = [...newState.enemySlots];
                             newSlots[idx] = newMonster;
                             newState.enemySlots = newSlots;
                        }
                    }
                    spellUsed = true;
                }
                break;
        }

        if (spellUsed) {
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
        const newDeck = shuffleDeck([...state.deck, ...cardsToReturn]);
        const emptySlots = [null, null, null, null];

        nextState = {
            ...state,
            player: { ...state.player, hp: newHp },
            enemySlots: emptySlots,
            deck: newDeck
        };
        break;
    }
    
    case 'SELL_ITEM': {
        const { newState, card, fromWhere } = removeCardFromSource(state, action.cardId);
        
        if (!card) return state;

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
        break;
    }

    default:
      return state;
  }
  
  if (nextState.player.hp <= 0 && nextState.status !== 'lost') {
      nextState.status = 'lost';
  }
  
  return stateWithRoundCheck(nextState);
};
