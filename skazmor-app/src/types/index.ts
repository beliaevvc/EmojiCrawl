export type CardType = 'weapon' | 'shield' | 'potion' | 'coin' | 'monster' | 'ability';

export interface Card {
  id: string;
  type: CardType;
  value: number;
  emoji: string;
  name: string;
  description?: string;
  meta?: {
    maxHp?: number; // For monsters
    perks?: string[]; // Perk IDs
    isBoss?: boolean;
    cost?: number; // For shop items or ability costs
  };
}

export interface MonsterConfig {
  id: string;
  hp: number;
  perks: string[];
  isBoss: boolean;
  count: number; // How many of this config in the deck
}

export type Category = 'weapon' | 'shield' | 'potion' | 'coin' | 'monster';

export interface HeroStats {
  hp: number;
  maxHp: number;
  gold: number;
  skills: string[]; // Skill IDs
}

export interface Template {
  id: string;
  name: string;
  hero: {
    maxHp: number;
    startGold: number;
  };
  deck: {
    weapons: { value: number; count: number }[];
    shields: { value: number; count: number }[];
    potions: { value: number; count: number }[];
    coins: { value: number; count: number }[];
    monsters: MonsterConfig[];
  };
  skills: string[];
}







