export type CardType = 'monster' | 'weapon' | 'shield' | 'potion' | 'coin' | 'spell' | 'skull';

export type SpellType = 
    | 'escape' | 'leech' | 'potionify' | 'wind' | 'sacrifice' 
    | 'split' | 'merchant' | 'volley' 
    | 'trophy' | 'epiphany' | 'deflection' | 'echo' | 'snack' 
    | 'swap' | 'anvil' | 'armor' | 'archive' | 'scout' | 'cut';

export type MonsterAbilityType = 
    | 'commission' | 'whisper' | 'silence' | 'breach' | 'disarm' | 'blessing'
    | 'trample' | 'mirror' | 'stealth' | 'scream' | 'legacy'
    | 'flee' | 'offering' | 'ambush' | 'theft' | 'rot' | 'web' | 'bones'
    | 'beacon' | 'parasite' | 'corrosion' | 'exhaustion' | 'junk' | 'miss' | 'corpseeater';

export type MonsterLabelType = 'ordinary' | 'tank' | 'medium' | 'mini-boss' | 'boss';

export type CurseType =
    | 'fog'
    | 'full_moon'
    | 'poison'      // 🥦 Отравление: зелья лечат хуже
    | 'tempering'   // 🛠️ Закалка: оружие сильнее
    | 'greed';      // 💰 Жадность: +2 💎 от любой монеты (облачный бонус)

export interface Card {
  id: string;
  type: CardType;
  value: number; // HP/Attack for monsters, Value for items
  maxHealth?: number; // For monsters (to track current HP vs Max)
  spellType?: SpellType;
  ability?: MonsterAbilityType;
  label?: MonsterLabelType;
  icon: string;
  name?: string;
  description?: string;
  priceMultiplier?: number;
  isHidden?: boolean; // For Fog curse
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
    templateName?: string; // If run started from a template
}

export interface RunHistoryEntry extends GameStats {
    id: string;
    gameNumber: number;
    date: string; // ISO string
    result: 'won' | 'lost';
    overheads: Overheads;
}

export interface MonsterGroupConfig {
    id: string; // Unique ID for editor keys
    value: number;
    count: number;
    ability?: MonsterAbilityType;
    label?: MonsterLabelType;
}

export interface DeckConfig {
    character: { hp: number; coins: number };
    shields: number[];
    weapons: number[];
    potions: number[];
    coins: number[];
    spells: SpellType[];
    monsters: MonsterGroupConfig[];
    curse?: CurseType | null; // Added curse config
}

export interface DeckTemplate {
    id: string;
    name: string;
    config: DeckConfig;
    createdAt: number;
}

export interface HpUpdate {
    from: number;
    to: number;
    source: string;
    timestamp: number;
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  enemySlots: (Card | null)[]; // Fixed 4 slots
  leftHand: HandSlot;
  rightHand: HandSlot;
  backpack: HandSlot;
  player: Player;
  hpUpdates: HpUpdate[];
  round: number;
  status: 'playing' | 'won' | 'lost';
  logs: LogEntry[];
  overheads: Overheads;
  stats: GameStats;
  activeEffects: (SpellType | 'miss')[];
  peekCards: Card[] | null;
  peekType?: 'epiphany' | 'whisper' | 'beacon';
  scoutCards: Card[] | null;
  lastEffect?: { type: string; targetId: string; value?: number; timestamp: number } | { type: string; targetId: string; value?: number; timestamp: number }[];
  isGodMode: boolean;
  curse: CurseType | null; // Active curse
  hasActed: boolean; // Блокирует выбор проклятия после первого действия
}

export const MAX_HP = 13;
