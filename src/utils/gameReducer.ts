// ... imports
import { GameState, LogEntry, Overheads, GameStats, Card, SpellType, MonsterGroupConfig, MonsterAbilityType } from '../types/game';
import { createDeck, shuffleDeck } from './gameLogic';
import { SPELLS } from '../data/spells';
import { MONSTER_ABILITIES } from '../data/monsterAbilities';

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

// Initial State
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
  activeEffects: [],
  peekCards: null,
  peekType: undefined,
  scoutCards: null
};

// ... (Action Types)
export type GameAction =
  | { type: 'INIT_GAME' }
  | { type: 'START_GAME'; deckConfig?: { character: { hp: number; coins: number }; shields: number[]; weapons: number[]; potions: number[]; coins: number[]; spells: SpellType[]; monsters: MonsterGroupConfig[] }; runType?: 'standard' | 'custom'; templateName?: string }
  | { type: 'TAKE_CARD_TO_HAND'; cardId: string; hand: 'left' | 'right' | 'backpack' }
  | { type: 'INTERACT_WITH_MONSTER'; monsterId: string; target: 'player' | 'shield_left' | 'shield_right' | 'weapon_left' | 'weapon_right' }
  | { type: 'USE_SPELL_ON_TARGET'; spellCardId: string; targetId: string }
  | { type: 'SELL_ITEM'; cardId: string }
  | { type: 'RESET_HAND' }
  | { type: 'CHECK_ROUND_END' }
  | { type: 'CLEAR_PEEK' }
  | { type: 'CLEAR_SCOUT' };

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

// Check active passive abilities
const hasActiveAbility = (state: GameState, ability: MonsterAbilityType): boolean => {
    return state.enemySlots.some(c => c?.type === 'monster' && c.ability === ability);
};

// Apply On Spawn Abilities
const applySpawnAbilities = (state: GameState, card: Card): GameState => {
    let newState = { ...state };
    if (!card.ability) return newState;

    switch (card.ability) {
        case 'ambush':
            newState.player.hp = Math.max(0, newState.player.hp - 1);
            newState = addLog(newState, `ЗАСАДА (${card.icon}): Герой получил 1 урон при появлении монстра.`, 'combat');
            break;
        case 'corpseeater':
            const deadMonsters = newState.discardPile.filter(c => c.type === 'monster').length;
            if (deadMonsters > 0) {
                // Update card in slot (it's already placed before this call usually, but we need to find it)
                // Actually, logic is cleaner if we modify card BEFORE placing.
                // But deck refilling places card then we might trigger this.
                // Let's assume we modify the card value in state.
                const slotIdx = newState.enemySlots.findIndex(c => c?.id === card.id);
                if (slotIdx !== -1) {
                    const newCard = { ...card, value: card.value + deadMonsters };
                    const newSlots = [...newState.enemySlots];
                    newSlots[slotIdx] = newCard;
                    newState.enemySlots = newSlots;
                    newState = addLog(newState, `ТРУПОЕД (${card.icon}): +${deadMonsters} HP за мертвых монстров.`, 'info');
                }
            }
            break;
        case 'exhaustion':
            // Reduce max HP while alive
            newState.player.maxHp = Math.max(1, newState.player.maxHp - 1);
            if (newState.player.hp > newState.player.maxHp) newState.player.hp = newState.player.maxHp;
            newState = addLog(newState, `ИЗНУРЕНИЕ (${card.icon}): Макс. HP снижено на 1.`, 'info');
            break;
    }
    return newState;
};

// Handle On Kill Abilities
const applyKillAbilities = (state: GameState, monster: Card, _killer?: 'weapon' | 'spell' | 'other'): GameState => {
    let newState = { ...state };
    
    // Global Spell Effect: Trophy (Any kill grants coins)
    if (newState.activeEffects.includes('trophy')) {
        newState.activeEffects = newState.activeEffects.filter(e => e !== 'trophy');
        newState.player.coins += 2;
        newState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + 2 });
        newState = addLog(newState, 'ТРОФЕЙ: +2 💎 за убийство монстра.', 'gain');
    }
    
    // Global Trigger: Parasite (other monsters heal)
    const parasites = newState.enemySlots.filter(c => c?.type === 'monster' && c.ability === 'parasite' && c.id !== monster.id);
    if (parasites.length > 0) {
        const newSlots = [...newState.enemySlots];
        parasites.forEach(p => {
            const idx = newSlots.findIndex(c => c?.id === p!.id);
            if (idx !== -1 && newSlots[idx]) {
                newSlots[idx] = { ...newSlots[idx]!, value: newSlots[idx]!.value + 1 };
            }
        });
        newState.enemySlots = newSlots;
        newState = addLog(newState, 'ПАРАЗИТ: другие монстры получили +1 HP.', 'info');
    }

    if (!monster.ability) return newState;

    switch (monster.ability) {
        case 'commission':
            newState.player.coins = Math.max(0, newState.player.coins - 3);
            newState = addLog(newState, `КОМИССИЯ: Потеряно 3 💎.`, 'gain');
            break;
        case 'whisper':
            const nextCoin = newState.deck.find(c => c.type === 'coin');
            if (nextCoin) {
                newState.peekCards = [nextCoin];
                newState.peekType = 'whisper';
                newState = addLog(newState, `ШЕПОТ ЛЕСА: Показана следующая монета.`, 'info');
            } else {
                newState = addLog(newState, `ШЕПОТ ЛЕСА: Монет в колоде больше нет.`, 'info');
            }
            break;
        case 'breach':
            // Discard random Shield
            const shields = [];
            if (newState.leftHand.card?.type === 'shield') shields.push('leftHand');
            if (newState.rightHand.card?.type === 'shield') shields.push('rightHand');
            if (newState.backpack?.type === 'shield') shields.push('backpack');
            
            if (shields.length > 0) {
                const targetLoc = shields[Math.floor(Math.random() * shields.length)];
                if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
                else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
                else if (targetLoc === 'backpack') newState.backpack = null;
                newState = addLog(newState, 'ПРОЛОМ: Щит уничтожен.', 'combat');
            }
            break;
        case 'disarm':
            const weapons = [];
            if (newState.leftHand.card?.type === 'weapon') weapons.push('leftHand');
            if (newState.rightHand.card?.type === 'weapon') weapons.push('rightHand');
            if (newState.backpack?.type === 'weapon') weapons.push('backpack');
            
            if (weapons.length > 0) {
                const targetLoc = weapons[Math.floor(Math.random() * weapons.length)];
                if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
                else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
                else if (targetLoc === 'backpack') newState.backpack = null;
                newState = addLog(newState, 'ОБЕЗОРУЖИВАНИЕ: Оружие выбито.', 'combat');
            }
            break;
        case 'blessing':
            const heal = 2;
            const newHp = Math.min(newState.player.maxHp, newState.player.hp + heal);
            newState.player.hp = newHp;
            newState = addLog(newState, `БЛАГОСЛОВЕНИЕ: +${heal} HP.`, 'heal');
            break;
        case 'graveyard':
            const deadMons = newState.discardPile.filter(c => c.type === 'monster');
            if (deadMons.length > 0) {
                const revived = deadMons[Math.floor(Math.random() * deadMons.length)];
                
                // Try to find empty slot first
                let targetIdx = newState.enemySlots.findIndex(c => c === null);
                
                // If no empty slot, pick a random slot to replace
                if (targetIdx === -1) {
                    targetIdx = Math.floor(Math.random() * 4);
                }

                if (targetIdx !== -1) {
                    const newSlots = [...newState.enemySlots];
                    // If replacing existing card, move it to discard? Or it just vanishes? 
                    // Usually "return to table" implies adding. Replacing might be harsh.
                    // But user asked "return random monster to table". If table full, it must replace or fail.
                    // Let's assume it replaces for now to ensure it works.
                    // Or maybe it shouldn't replace if full? "If full, nothing happens" is safer.
                    // Re-reading: "on death... return random monster from discard".
                    // If table is full of monsters, adding one more is impossible unless replacing.
                    // Let's prioritize empty slot. If full, do nothing?
                    // "Should return random monster". Let's force it by replacing a random card if full.
                    // Ideally replacing a non-monster if possible?
                    // Let's stick to: Find empty -> if none, find non-monster -> if none, replace random.
                    
                    if (newSlots[targetIdx] !== null) {
                         // We are overwriting something. Move old to discard to be safe/fair?
                         // Or just overwrite. Let's overwrite.
                    }

                    newSlots[targetIdx] = revived; 
                    newState.enemySlots = newSlots;
                    newState.discardPile = newState.discardPile.filter(c => c.id !== revived.id);
                    newState = addLog(newState, `КЛАДБИЩЕ: ${revived.icon} восстал из мертвых!`, 'combat');
                    
                    // Apply spawn effects for revived
                    newState = applySpawnAbilities(newState, revived);
                }
            }
            break;
        case 'legacy':
            const legacySlots = [...newState.enemySlots];
            let buffed = false;
            legacySlots.forEach((c, i) => {
                if (c && c.type === 'monster' && c.id !== monster.id) {
                    legacySlots[i] = { ...c, value: c.value + 1 };
                    buffed = true;
                }
            });
            if (buffed) {
                newState.enemySlots = legacySlots;
                newState = addLog(newState, 'НАСЛЕДИЕ: остальные монстры получили +1 HP.', 'info');
            }
            break;
        case 'theft':
            const items = [];
            if (newState.leftHand.card) items.push('leftHand');
            if (newState.rightHand.card) items.push('rightHand');
            if (newState.backpack) items.push('backpack');
            
            if (items.length > 0) {
                const targetLoc = items[Math.floor(Math.random() * items.length)];
                if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
                else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
                else if (targetLoc === 'backpack') newState.backpack = null;
                newState = addLog(newState, 'ПОХИЩЕНИЕ: предмет украден!', 'combat');
            }
            break;
        case 'bones':
            const deadCoin: Card = {
                id: `dead_coin_${Math.random()}`,
                type: 'coin',
                value: 0,
                icon: '☠️',
                name: 'Мертвая монета',
                description: 'Ничего не стоит.'
            };
            // Add to deck
            const insertIdx = Math.floor(Math.random() * newState.deck.length);
            const newDeck = [...newState.deck];
            newDeck.splice(insertIdx, 0, deadCoin);
            newState.deck = newDeck;
            newState = addLog(newState, 'КОСТИ: Мертвая монета замешана в колоду.', 'info');
            break;
        case 'corrosion':
            const invItems = [];
            if (newState.leftHand.card) invItems.push(newState.leftHand.card);
            if (newState.rightHand.card) invItems.push(newState.rightHand.card);
            if (newState.backpack) invItems.push(newState.backpack);
            
            const validInv = invItems.filter(c => c.value > 0);
            if (validInv.length > 0) {
                const target = validInv[Math.floor(Math.random() * validInv.length)];
                const newVal = Math.max(0, target.value - 2);
                
                // Need to find where it is to update
                if (newState.leftHand.card?.id === target.id) newState.leftHand.card = { ...target, value: newVal };
                else if (newState.rightHand.card?.id === target.id) newState.rightHand.card = { ...target, value: newVal };
                else if (newState.backpack?.id === target.id) newState.backpack = { ...target, value: newVal };
                
                newState = addLog(newState, `КОРРОЗИЯ: ${target.icon} ослаблен (-2).`, 'combat');
            }
            break;
        case 'exhaustion':
            // Restore Max HP when killed
            newState.player.maxHp = Math.min(13, newState.player.maxHp + 1); // Assuming 13 is global max? Or just restore what was taken. 
            // If base max is 13.
            newState = addLog(newState, 'ИЗНУРЕНИЕ: Макс. HP восстановлено.', 'info');
            break;
        case 'junk':
            const junkCoin: Card = {
                id: `junk_coin_${Math.random()}`,
                type: 'coin',
                value: 0,
                icon: '🗑️',
                name: 'Хлам',
                description: 'Мусор.'
            };
            if (!newState.backpack) newState.backpack = junkCoin;
            else newState = addLog(newState, 'ХЛАМ: Рюкзак полон, хлам не влез.', 'info');
            break;
        case 'miss':
            // Apply next attack debuff.
            newState.activeEffects = [...newState.activeEffects, 'miss']; 
            newState = addLog(newState, 'ПРОМАХ: Следующая атака слабее.', 'combat');
            break;
    }
    return newState;
};

// Update Mirror Monsters
const updateMirrorMonsters = (state: GameState): GameState => {
    // Calculate max weapon damage
    let maxDmg = 0;
    if (state.leftHand.card?.type === 'weapon') maxDmg = Math.max(maxDmg, state.leftHand.card.value);
    if (state.rightHand.card?.type === 'weapon') maxDmg = Math.max(maxDmg, state.rightHand.card.value);
    if (state.backpack?.type === 'weapon') maxDmg = Math.max(maxDmg, state.backpack.value);

    let newState = { ...state };
    const newSlots = [...newState.enemySlots];
    let changed = false;

    newSlots.forEach((c, i) => {
        if (c && c.type === 'monster' && c.ability === 'mirror') {
            const baseVal = c.maxHealth || 0;
            const targetVal = maxDmg > 0 ? maxDmg : baseVal;
            
            if (c.value !== targetVal) {
                newSlots[i] = { ...c, value: targetVal };
                changed = true;
            }
        }
    });

    if (changed) {
        newState.enemySlots = newSlots;
        newState = addLog(newState, 'ЗЕРКАЛО: Сила монстра изменилась.', 'info');
    }
    return newState;
}

// Handle attack logic
const handleMonsterAttack = (state: GameState, monster: any, defenseType: 'body' | 'shield', shieldHand?: 'left' | 'right'): { state: GameState, log?: string, logType?: LogEntry['type'], monsterKept?: boolean } => {
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
            
            // Find targets
            const allMonsters = newState.enemySlots
                .map((c, i) => ({c, i}))
                .filter(item => item.c?.type === 'monster') as {c: Card, i: number}[];
            
            const otherMonsters = allMonsters.filter(item => item.c.id !== monster.id);
            
            let targetIdx: number;
            let targetMonster: Card;

            if (otherMonsters.length > 0) {
                // Hit random other
                const target = otherMonsters[Math.floor(Math.random() * otherMonsters.length)];
                targetIdx = target.i;
                targetMonster = target.c;
            } else {
                // Hit self (if no others)
                const selfEntry = allMonsters.find(item => item.c.id === monster.id);
                if (!selfEntry) return { state: newState }; // Should not happen
                targetIdx = selfEntry.i;
                targetMonster = selfEntry.c;
            }

            // Apply Damage
            const newHp = Math.max(0, targetMonster.value - damage);
            const newSlots = [...newState.enemySlots];
            
            if (newHp === 0) {
                newSlots[targetIdx] = null;
                log = `ОТВОД: Урон (${damage}) отражен в ${targetMonster.icon}. Монстр погиб!`;
                newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                newState.enemySlots = newSlots;
                newState = applyKillAbilities(newState, targetMonster, 'other');
                newState.discardPile = [...newState.discardPile, targetMonster];
            } else {
                newSlots[targetIdx] = { ...targetMonster, value: newHp };
                log = `ОТВОД: Урон (${damage}) отражен в ${targetMonster.icon}.`;
                newState.enemySlots = newSlots;
            }
            
            // If we hit self and died, slot is already null.
            // If we hit self and lived, slot is updated.
            // If we hit other, attacker slot (monster) is untouched and should remain.
            // In all cases, we handled the "outcome" of the attack here, so we return monsterKept=true
            // to prevent the default "remove attacker" logic in INTERACT_WITH_MONSTER.
            
            return { state: newState, log, logType: 'combat', monsterKept: true };
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

        // Trample Ability
        if (monster.ability === 'trample') {
            if (shieldHand === 'left') newState.leftHand = { ...newState.leftHand, card: null };
            else newState.rightHand = { ...newState.rightHand, card: null };
            log = `ТОПОТ: Щит разрушен мгновенно!`;
            return { state: newState, log, logType: 'combat' };
        }

        const blocked = Math.min(shield.value, damage);
        const overflow = Math.max(0, damage - blocked);
        const overdef = Math.max(0, shield.value - damage);
        
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
             newState.discardPile = [...newState.discardPile, shield];
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

    let damage = weapon.value;
    
    // Miss Ability (Debuff on player)
    if (newState.activeEffects.includes('miss')) {
        damage = Math.max(0, damage - 2);
        newState.activeEffects = newState.activeEffects.filter(e => e !== 'miss');
    }

    const monsterHp = monster.value;
    let log = '';

    const overdamage = Math.max(0, damage - monsterHp);
    
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
        
        // Apply Kill Abilities (monster not in discard yet)
        newState = applyKillAbilities(newState, monster, 'weapon');

        // Add to discard pile AFTER abilities trigger (so Graveyard won't pick self)
        newState.discardPile = [...newState.discardPile, monster];

    } else {
        const newMonsterHp = monsterHp - damage;
        
        // Flee Ability check
        if (monster.ability === 'flee' && newMonsterHp <= 3) {
            const newSlots = [...newState.enemySlots];
            newSlots[monsterIdx] = null;
            newState.enemySlots = newSlots;
            // Return to deck
            newState.deck = shuffleDeck([...newState.deck, { ...monster, value: newMonsterHp }]);
            log = `Монстр ранен (${damage}), но сбежал в колоду (БЕГСТВО)!`;
        } else {
            const newMonster = { ...monster, value: newMonsterHp };
            const newSlots = [...newState.enemySlots];
            newSlots[monsterIdx] = newMonster;
            newState.enemySlots = newSlots;
            log = `Монстру нанесено ${damage} урона.`;
        }
    }

    if (weaponHand === 'left') newState.leftHand = { ...newState.leftHand, card: null };
    else newState.rightHand = { ...newState.rightHand, card: null };

    newState.discardPile = [...newState.discardPile, weapon];

    return { state: newState, log, logType: 'combat' };
}

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const stateWithRoundCheck = (s: GameState): GameState => { 
     if (s.status === 'lost') return s;

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
          
          // Beacon Ability: increase monster chance (naive implementation: try pull monster from top 5)
          const beaconActive = hasActiveAbility(s, 'beacon');

          for(let i=0; i<4; i++) {
             if (newSlots[i] === null && deck.length > 0) {
                let cardToDraw: Card | undefined;
                
                if (beaconActive) {
                    const monsterIdx = deck.slice(0, 5).findIndex(c => c.type === 'monster');
                    if (monsterIdx !== -1) {
                        cardToDraw = deck.splice(monsterIdx, 1)[0];
                    }
                }
                
                if (!cardToDraw) cardToDraw = deck.pop();

                if (cardToDraw) {
                    newSlots[i] = cardToDraw;
                    // Trigger On Spawn
                    // We need to apply spawn abilities recursively because state might change
                    // But here we are inside a pure reducer helper.
                    // This is tricky.
                    // Simplified: We cannot easily chain state updates inside this loop without a refactor.
                    // Limitation: Spawn abilities will activate NEXT action or I need to handle them now.
                    // Let's try to handle them now by mutating a local temp state 'newState'.
                }
             }
          }

          const clearUsedHand = (hand: any): any => {
             if (hand.card?.type === 'coin' || hand.card?.type === 'potion') {
                 return { card: null, blocked: false };
             }
             return { ...hand, blocked: false };
          };

          let newState = {
             ...s,
             deck,
             enemySlots: newSlots,
             leftHand: clearUsedHand(s.leftHand),
             rightHand: clearUsedHand(s.rightHand),
             round: s.round + 1
          };
          
          // Apply Spawn Abilities for new cards
          newState.enemySlots.forEach((c) => {
              if (c && c.type === 'monster' && !s.enemySlots.some(old => old?.id === c.id)) {
                  newState = applySpawnAbilities(newState, c);
              }
          });

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
          const baseDeck = createDeck();
          // Filter out everything base
          const baseMonsters = baseDeck.filter(c => c.type === 'monster'); // Fallback if no monsters config?
          
          const { shields, weapons, potions, coins, spells, monsters } = action.deckConfig;

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

          // Custom Monsters Generation
          let generatedMonsters: Card[] = [];
          if (monsters && monsters.length > 0) {
              monsters.forEach(group => {
                  const abilityDef = group.ability ? MONSTER_ABILITIES.find(a => a.id === group.ability) : null;
                  for (let i = 0; i < group.count; i++) {
                      generatedMonsters.push({
                          id: `monster_${group.value}_${i}_${Math.random().toString(36).substr(2,5)}`,
                          type: 'monster',
                          value: group.value,
                          maxHealth: group.value,
                          icon: '🐺', // Always use Wolf, ability icon is badge
                          ability: group.ability,
                          name: abilityDef ? abilityDef.name : `Монстр ${group.value}`,
                          description: abilityDef ? abilityDef.description : undefined
                      });
                  }
              });
          } else {
              generatedMonsters = baseMonsters;
          }

          newDeck = shuffleDeck([...generatedMonsters, ...customShields, ...customWeapons, ...customPotions, ...customCoins, ...customSpells]);
      } else {
          let standardDeck = createDeck();
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

      // Fill slots
      for (let i = 0; i < 4; i++) {
        if (newDeck.length > 0) {
          const card = newDeck.pop() || null;
          enemySlots[i] = card;
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
        stats: { ...initialStats, startTime: Date.now(), runType: runType, templateName: action.templateName },
        activeEffects: []
      };

      // Apply Spawn Abilities for initial hand
      nextState.enemySlots.forEach(c => {
          if (c && c.type === 'monster') {
              nextState = applySpawnAbilities(nextState, c);
          }
      });
      nextState = updateMirrorMonsters(nextState);

      break;
    }

    case 'TAKE_CARD_TO_HAND': {
      // Check for Web Ability (Block backpack)
      if (action.hand === 'backpack' && hasActiveAbility(state, 'web')) {
          logMessage = 'ПАУТИНА: Рюкзак заблокирован!';
          break; // Cancel action
      }

      const { newState, card } = removeCardFromSource(state, action.cardId);
      
      if (!card) return state;

      if (action.hand === 'backpack') {
         if (newState.backpack) return state;
         nextState = { ...newState, backpack: card };
         logMessage = `В рюкзак положено: ${card.icon}`;
         break;
      }
      
      const targetHand = action.hand === 'left' ? newState.leftHand : newState.rightHand;
      if (targetHand.card || targetHand.blocked) return state;

      let blocked = false;
      let playerUpdates = {};

      if (newState.activeEffects.includes('echo')) {
          // Consume spell immediately
          newState.activeEffects = newState.activeEffects.filter(e => e !== 'echo');

          if (!newState.backpack && !hasActiveAbility(state, 'web')) { 
              const copy = { ...card, id: card.id + '_echo_' + Math.random().toString(36).substr(2, 5) };
              newState.backpack = copy;
              logMessage = 'ЭХО: Предмет дублирован в рюкзак. ';
          } else {
              logMessage = 'ЭХО: Магия рассеялась (рюкзак занят). ';
          }
      }

      if (card.type === 'coin') {
         newState.discardPile = [...newState.discardPile, card]; // Add to discard
         blocked = true;
         playerUpdates = { coins: newState.player.coins + card.value };
         logMessage += `Собрано: +${card.value} монет`;
         logType = 'gain';
         nextState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + card.value });

         // Offering Ability
         const offeringMonsters = newState.enemySlots.filter(c => c?.type === 'monster' && c.ability === 'offering');
         if (offeringMonsters.length > 0) {
             const newSlots = [...newState.enemySlots];
             offeringMonsters.forEach(m => {
                 const idx = newSlots.findIndex(c => c?.id === m!.id);
                 if (idx !== -1 && newSlots[idx]) {
                     newSlots[idx] = { ...newSlots[idx]!, value: newSlots[idx]!.value + card.value };
                 }
             });
             newState.enemySlots = newSlots;
             logMessage += ` (ПОДНОШЕНИЕ: монстры исцелены на ${card.value})`;
         }

      } else if (card.type === 'potion') {
         newState.discardPile = [...newState.discardPile, card]; // Add to discard
         blocked = true;
         const healAmount = card.value;
         
         // Rot Ability Check
         let rotMod = 0;
         if (hasActiveAbility(newState, 'rot')) rotMod = -2;
         
         const effectiveHeal = Math.max(0, healAmount + rotMod);

         const neededHeal = newState.player.maxHp - newState.player.hp;
         const overheal = Math.max(0, effectiveHeal - neededHeal);
         const actualHeal = Math.min(effectiveHeal, neededHeal);
         
         const newHp = newState.player.hp + actualHeal;
         playerUpdates = { hp: newHp };
         
         logMessage += `Выпито зелье: +${actualHeal} HP`;
         if (rotMod < 0) logMessage += ' (ГНИЛЬ: -2)';
         
         nextState = updateStats(newState, { hpHealed: newState.stats.hpHealed + actualHeal });

         if (overheal > 0) {
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

        // Stealth Check (Redesigned)
        // If monster has Stealth, check if ANY other non-stealth monster exists.
        // If so, THIS monster is blocked from ALL interactions.
        if (monster.ability === 'stealth') {
            const otherMonsters = state.enemySlots.filter(c => c?.type === 'monster' && c.id !== monster.id && c.ability !== 'stealth');
            if (otherMonsters.length > 0) {
                logMessage = 'СКРЫТНОСТЬ: Монстр скрыт за спинами других!';
                break;
            }
        }

        if (action.target === 'player') {
            const res = handleMonsterAttack(state, monster, 'body');
            nextState = res.state;
            
            if (!res.monsterKept) {
                // Remove monster after attack
                const newSlots = [...nextState.enemySlots];
                newSlots[monsterIdx] = null;
                nextState.enemySlots = newSlots;
                
                // Stats: Monster died attacking player
                nextState = updateStats(nextState, { monstersKilled: nextState.stats.monstersKilled + 1 });
                
                // Trigger Kill Abilities (before adding to discard)
                nextState = applyKillAbilities(nextState, monster, 'other');

                // Add to discard pile
                nextState.discardPile = [...nextState.discardPile, monster];
            }
            
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

                 const newSlots = [...nextState.enemySlots];
                 newSlots[monsterIdx] = null;
                 nextState.enemySlots = newSlots;
                 
                 // Stats: Monster died attacking shield
                 nextState = updateStats(nextState, { monstersKilled: nextState.stats.monstersKilled + 1 });
                 
                 // Trigger Kill Abilities (before adding to discard)
                 nextState = applyKillAbilities(nextState, monster, 'other');

                 // Add to discard
                 nextState.discardPile = [...nextState.discardPile, monster];

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
        
        // Silence Check
        if (hasActiveAbility(state, 'silence')) {
            logMessage = 'МОЛЧАНИЕ: Магия заблокирована!';
            break;
        }

        // Stealth Check for Spells on Monsters
        // (Wait, user said "blocked while other monster exists". Does this apply to spells? 
        // "Interact with monster" usually means drag-drop interactions. 
        // Let's assume complete block including spells for consistency, or just drag interactions?
        // "Interact with monster" block above covers Drag Monster -> X.
        // Spell -> Monster needs check here.
        // Assuming "Hidden" means untargetable.)
        
        const targetLocPre = findCardLocation(state, targetId);
        if (targetLocPre === 'enemySlots') {
             const idx = state.enemySlots.findIndex(c => c?.id === targetId);
             if (idx !== -1) {
                 const targetMonster = state.enemySlots[idx];
                 if (targetMonster && targetMonster.type === 'monster' && targetMonster.ability === 'stealth') {
                     const otherMonsters = state.enemySlots.filter(c => c?.type === 'monster' && c.id !== targetId && c.ability !== 'stealth');
                     if (otherMonsters.length > 0) {
                         logMessage = 'СКРЫТНОСТЬ: Нельзя применить магию, монстр скрыт!';
                         break;
                     }
                 }
             }
        }

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
                    let cardToReturn = targetCard;
                    // Reset monster HP to maxHealth if available
                    if (targetCard.type === 'monster' && targetCard.maxHealth) {
                        cardToReturn = { ...targetCard, value: targetCard.maxHealth };
                    }

                    const newDeck = shuffleDeck([...newState.deck, cardToReturn]);
                    
                     if (targetLoc === 'enemySlots') {
                        const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                        const newSlots = [...newState.enemySlots];
                        newSlots[idx] = null;
                        newState.enemySlots = newSlots;
                    }
                    newState.deck = newDeck;
                    spellUsed = true;
                    logMessage = 'Заклинание ВЕТЕР: карта вернулась в колоду (HP восстановлено).';
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
                             
                             // Trigger Abilities (Spell kill counts?)
                             newState = applyKillAbilities(newState, targetCard, 'spell');
                             
                             newState.discardPile = [...newState.discardPile, targetCard];

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
                        newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                        newState = applyKillAbilities(newState, targetCard, 'spell');
                        newState.discardPile = [...newState.discardPile, targetCard];
                        logMessage = 'РАСЩЕПЛЕНИЕ: монстр уничтожен (слишком мал).';
                    }
                    spellUsed = true;
                }
                break;

            case 'barrier':
                if (targetCard?.type === 'monster') {
                    const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                    const newSlots = [...newState.enemySlots];
                    // Set value to 0 instead of removing
                    newSlots[idx] = { ...targetCard, value: 0 }; 
                    newState.enemySlots = newSlots;
                    logMessage = 'БАРЬЕР: монстр ослаблен (атака 0).';
                    spellUsed = true;
                }
                break;

            case 'merchant':
                if (targetCard && (targetCard.type === 'weapon' || targetCard.type === 'shield' || targetCard.type === 'potion')) {
                    const newCard = { ...targetCard, priceMultiplier: 2 };
                    
                    if (targetLoc === 'enemySlots') {
                        const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                        const ns = [...newState.enemySlots];
                        ns[idx] = newCard;
                        newState.enemySlots = ns;
                    } else if (targetLoc === 'leftHand') newState.leftHand.card = newCard;
                    else if (targetLoc === 'rightHand') newState.rightHand.card = newCard;
                    else if (targetLoc === 'backpack') newState.backpack = newCard;

                    logMessage = `СКУПЩИК: предмет теперь стоит в 2 раза дороже при продаже.`;
                    spellUsed = true;
                }
                break;

            case 'volley':
                if (targetId === 'player') { 
                    const ns = [...newState.enemySlots];
                    let hits = 0;
                    ns.forEach((c, i) => {
                        if (c && c.type === 'monster') {
                            const newVal = c.value - 1;
                            if (newVal <= 0) {
                                ns[i] = null;
                                newState = updateStats(newState, { monstersKilled: newState.stats.monstersKilled + 1 });
                                newState = applyKillAbilities(newState, c, 'spell');
                                newState.discardPile = [...newState.discardPile, c];
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
                    newState.peekCards = top3;
                    newState.peekType = 'epiphany';
                    logMessage = `ПРОЗРЕНИЕ: Открыто будущее (${top3.length} карт).`;
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
                if (targetId === 'player') {
                    // Find all monsters
                    const monsters = newState.enemySlots
                        .map((c, i) => ({c, i}))
                        .filter(x => x.c && x.c.type === 'monster') as {c: Card, i: number}[];

                    if (monsters.length >= 2) {
                        // Pick two random distinct monsters
                        const shuffled = [...monsters].sort(() => 0.5 - Math.random());
                        const m1 = shuffled[0];
                        const m2 = shuffled[1];

                        const val1 = m1.c.value;
                        const val2 = m2.c.value;

                        const newM1 = { ...m1.c, value: val2 };
                        const newM2 = { ...m2.c, value: val1 };

                        const ns = [...newState.enemySlots];
                        ns[m1.i] = newM1;
                        ns[m2.i] = newM2;
                        newState.enemySlots = ns;
                        
                        logMessage = `ЗАМЕНА: ${m1.c.icon} (${val1}) 🔄 ${m2.c.icon} (${val2})`;
                    } else {
                        logMessage = 'ЗАМЕНА: Недостаточно монстров (сработало вхолостую).';
                    }
                    spellUsed = true;
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
                    if (newState.discardPile.length > 0) {
                        const valid = newState.discardPile.filter(c => c.type !== 'monster');
                        if (valid.length > 0 && !newState.backpack && !hasActiveAbility(state, 'web')) {
                            const randomCard = valid[Math.floor(Math.random() * valid.length)];
                            newState.backpack = randomCard;
                            newState.discardPile = newState.discardPile.filter(c => c.id !== randomCard.id);
                            logMessage = `АРХИВ: ${randomCard.icon} возвращен в рюкзак.`;
                            spellUsed = true;
                        } else {
                            logMessage = 'АРХИВ: нет подходящих карт или рюкзак полон/заблокирован.';
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
                        const count = Math.min(2, newState.deck.length);
                        // Get top cards for display (reversed so [0] is top)
                        const topCards = newState.deck.slice(-count).reverse();
                        
                        // Store for UI display
                        newState.scoutCards = topCards;

                        const top = newState.deck[newState.deck.length - 1]; // Top card (pop end)
                        // Discard it
                        newState.deck = newState.deck.slice(0, -1);
                        newState.discardPile = [...newState.discardPile, top];
                        
                        let msg = `РАЗВЕДКА: Сброшен ${top.icon}.`;
                        if (topCards.length > 1) {
                            msg += ` Следующий: ${topCards[1].icon}`;
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
                        newState = applyKillAbilities(newState, targetCard, 'spell');
                        newState.discardPile = [...newState.discardPile, targetCard];
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
            newState.discardPile = [...newState.discardPile, spellCard];
            
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
        // Scream Check
        if (hasActiveAbility(state, 'scream')) {
            logMessage = 'КРИК: Продажа заблокирована монстром!';
            break;
        }

        // Pre-check for Monster type
        let cardToSell: Card | null = null;
        if (state.leftHand.card?.id === action.cardId) cardToSell = state.leftHand.card;
        else if (state.rightHand.card?.id === action.cardId) cardToSell = state.rightHand.card;
        else if (state.backpack?.id === action.cardId) cardToSell = state.backpack;
        else {
             const idx = state.enemySlots.findIndex(c => c?.id === action.cardId);
             if (idx !== -1) cardToSell = state.enemySlots[idx];
        }

        if (cardToSell && cardToSell.type === 'monster') {
             logMessage = 'Нельзя продать монстра!';
             break;
        }

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
        
        if (card.priceMultiplier) {
            coinsToAdd *= card.priceMultiplier;
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

    case 'CLEAR_PEEK':
        return { ...state, peekCards: null, peekType: undefined };

    case 'CLEAR_SCOUT':
        return { ...state, scoutCards: null };

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
  
  return updateMirrorMonsters(stateWithRoundCheck(nextState));
};
