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

export interface GameState {
  deck: Card[];
  enemySlots: (Card | null)[]; // Fixed 4 slots
  leftHand: HandSlot;
  rightHand: HandSlot;
  backpack: Card | null;
  player: Player;
  round: number;
  status: 'playing' | 'won' | 'lost';
}

export const MAX_HP = 13;

