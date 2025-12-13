export type CardType = 'monster' | 'weapon' | 'shield' | 'potion' | 'coin' | 'spell';

export type SpellType = 'escape' | 'leech' | 'potionify' | 'wind' | 'sacrifice';

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
}

export interface GameState {
  deck: Card[];
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
}

export const MAX_HP = 13;
