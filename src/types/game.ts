export type CardType = 'monster' | 'weapon' | 'shield' | 'potion' | 'coin' | 'spell';

export type SpellType = 
    | 'escape' | 'leech' | 'potionify' | 'wind' | 'sacrifice' 
    | 'split' | 'barrier' | 'wardrobe' | 'merchant' | 'volley' 
    | 'trophy' | 'epiphany' | 'deflection' | 'echo' | 'snack' 
    | 'swap' | 'anvil' | 'armor' | 'archive' | 'scout' | 'cut';

export interface Card {
  id: string;
  type: CardType;
  value: number; // HP/Attack for monsters, Value for items
  maxHealth?: number; // For monsters (to track current HP vs Max)
  spellType?: SpellType;
  icon: string;
  name?: string;
  description?: string;
}

export interface Player {
  hp: number;
  maxHp: number;
  coins: number;
}

export interface HandSlot {
  card: Card | null;
  blocked: boolean; // If true, cannot use or place card until next round
}

export interface LogEntry {
    id: string;
    message: string;
    type: 'info' | 'combat' | 'heal' | 'gain' | 'spell';
    timestamp: number;
}

export interface Overheads {
    overheal: number;
    overdamage: number;
    overdef: number;
}

export interface GameStats {
    monstersKilled: number;
    coinsCollected: number; // Total value of coins collected
    hpHealed: number;
    damageDealt: number;
    damageBlocked: number;
    damageTaken: number;
    resetsUsed: number;
    itemsSold: number;
    startTime: number;
    endTime: number | null;
    runType: 'standard' | 'custom';
}

export interface RunHistoryEntry extends GameStats {
    id: string;
    gameNumber: number;
    date: string; // ISO string
    result: 'won' | 'lost';
    overheads: Overheads;
}

export interface DeckConfig {
    character: { hp: number; coins: number };
    shields: number[];
    weapons: number[];
    potions: number[];
    coins: number[];
    spells: SpellType[];
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  enemySlots: (Card | null)[]; // Fixed 4 slots
  leftHand: HandSlot;
  rightHand: HandSlot;
  backpack: Card | null;
  player: Player;
  round: number;
  status: 'playing' | 'won' | 'lost';
  logs: LogEntry[];
  overheads: Overheads;
  stats: GameStats;
  activeEffects: SpellType[];
}

export const MAX_HP = 13;
