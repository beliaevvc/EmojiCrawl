// Доменная модель (Domain Model)
// Определения типов данных игры.
// Этот файл — часть “чистого ядра” (Domain Kernel): не зависит от UI/React и инфраструктуры.
//
// Важно для архитектуры:
// - Domain описывает “какие данные есть в игре” и “какие действия возможны”,
// - но domain не должен знать, откуда приходят справочные данные (иконки/названия/описания).
//
// Блок 4 (Content Layer) добавил сюда типы `*Meta` и поле `action.content` как временный компромисс:
// - домену нужно собрать стартовую колоду и сформировать карты (spell/монстры в custom-run) с нужными
//   именами/описаниями/иконками,
// - но домен не должен импортить `src/data/*` или `src/content/*`,
// - поэтому application слой “прикладывает” минимальный snapshot данных через action.
//
// Договорённость:
// - `*Meta` используется только для отображения/логов/инициализации,
// - механика эффектов остаётся в reducer/правилах домена.

export type CardType =
  | 'monster'
  | 'weapon'
  | 'shield'
  | 'potion'
  | 'coin'
  | 'spell'
  | 'skull'
  // Traveling Merchant (покупаемые артефакты; эффекты добавим следующей партией)
  | 'bravery_potion'
  | 'claymore'
  | 'prayer_spell';

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
    | 'greed'       // 💰 Жадность: +2 💎 от любой монеты (облачный бонус)
    | 'darkness';   // 🌑 Тьма: визуальный оверлей (как Lumos), фронт-only

export interface Card {
  id: string;
  type: CardType;
  value: number; // Для монстров: текущий HP/сила. Для предметов: значение эффекта/номинал.
  maxHealth?: number; // Для монстров: максимум HP (нужно, чтобы отличать текущий HP от max).
  spellType?: SpellType;
  ability?: MonsterAbilityType;
  label?: MonsterLabelType;
  icon: string;
  name?: string;
  description?: string;
  priceMultiplier?: number;
  isHidden?: boolean; // Для проклятия “Туман”: карта скрыта и недоступна для взаимодействия

  /**
   * Merchant (Traveling Merchant) — UI/Gameplay метки для междураундового магазина.
   *
   * Важно:
   * - это не “контент-пак” и не данные колоды: это служебные поля для токенов торговца,
   * - они используются только когда активен merchant overlay и не участвуют в обычной логике колоды.
   */
  merchantOfferType?: 'bravery_potion' | 'claymore' | 'prayer';
  merchantPrice?: number; // Цена в 💎 (забеговая валюта `player.coins`)
  merchantAction?: 'leave'; // Служебный токен “🚪 Уйти”
}

export interface Player {
  hp: number;
  maxHp: number;
  coins: number;
}

export interface HandSlot {
  card: Card | null;
  blocked: boolean; // Если true — нельзя использовать/перекладывать карту до следующего раунда
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
    coinsCollected: number; // Суммарный номинал собранных монет
    hpHealed: number;
    damageDealt: number;
    damageBlocked: number;
    damageTaken: number;
    resetsUsed: number;
    itemsSold: number;
    startTime: number;
    endTime: number | null;
    runType: 'standard' | 'custom';
    templateName?: string; // Если забег стартовал из шаблона
}

export interface RunHistoryEntry extends GameStats {
    id: string;
    gameNumber: number;
    date: string; // ISO-строка
    result: 'won' | 'lost';
    overheads: Overheads;
}

export interface MonsterGroupConfig {
    id: string; // Уникальный id (нужен для ключей в редакторе)
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
    curse?: CurseType | null; // Выбранное проклятие для забега (если есть)
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
  enemySlots: (Card | null)[]; // Фиксированно 4 слота “стола”
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
  curse: CurseType | null; // Активное проклятие
  hasActed: boolean; // Блокирует выбор проклятия после первого действия

  /**
   * Traveling Merchant — междураундовое событие-магазин (Variant B: overlay).
   *
   * Идея:
   * - торговец не “подменяет” `enemySlots`, а рисуется поверх стола,
   * - последняя карта раунда остаётся на столе, но перекрывается токеном “🚪 Уйти”,
   * - товары рисуются в остальных трёх слотах.
   */
  merchant: {
    /** 40% шанс на старте забега (если false — торговец в этом забеге не появится). */
    willAppear: boolean;
    /** Раунд, в начале которого должен появиться торговец (после `round++`). */
    scheduledRound: number | null;
    /** За забег торговец может прийти максимум один раз. */
    hasAppeared: boolean;
    /** Сейчас торговец активен (overlay открыт). */
    isActive: boolean;
    /** Индекс слота стола (0..3), где лежит “последняя карта” и поверх неё показывается 🚪. */
    blockedSlotIndex: number | null;
    /** Карты-товары (3 шт.). */
    offers: Card[];
    /** Слоты overlay (длина 4): в заблокированном слоте лежит 🚪, в остальных — товары. */
    overlaySlots: (Card | null)[];
    /** Во время торговца разрешена строго 1 продажа из рюкзака. */
    saleUsed: boolean;
    /** За визит торговца можно купить максимум один артефакт (после покупки магазин закрывается). */
    hasBought: boolean;
  };
}

/**
 * UI/Presentation метаданные, которые application слой может приложить к action,
 * чтобы domain не тянул статический контент напрямую (Блок 4).
 *
 * Важно: это НЕ влияет на механику; это только для логов/отображения.
 */
export type CurseMeta = {
  name: string;
  icon: string;
  color?: string;
};

/**
 * UI/Presentation метаданные для заклинаний.
 * Используем для сборки колоды/карточек без прямых импортов `data/*` в domain (Блок 4).
 */
export type SpellMeta = {
  name: string;
  description: string;
  icon: string;
};

/**
 * UI/Presentation метаданные для способностей монстров.
 *
 * Нужно, чтобы:
 * - при генерации кастомных монстров (custom-run) мы могли заполнить `name/description` карточки,
 * - не импортируя `src/data/monsterAbilities` прямо из domain.
 */
export type MonsterAbilityMeta = {
  name: string;
  description: string;
  icon: string;
};

export type GameAction =
  | { type: 'INIT_GAME' }
  | { type: 'TOGGLE_GOD_MODE' }
  | {
      type: 'START_GAME';
      deckConfig?: {
        character: { hp: number; coins: number };
        shields: number[];
        weapons: number[];
        potions: number[];
        coins: number[];
        spells: SpellType[];
        monsters: MonsterGroupConfig[];
        curse?: CurseType | null;
      };
      runType?: 'standard' | 'custom';
      templateName?: string;
      /**
       * Content snapshot для стартовой сборки колоды (и только для неё).
       * Это компромисс Блока 4: домену нужен минимум “презентационных” полей, но
       * домен не должен импортить `src/data/*`.
       *
       * Почему не передаём весь `GameContent`:
       * - `GameContent` живёт в content/application слоях,
       * - domain держим чистым, поэтому передаём только то, что реально требуется для `START_GAME`.
       */
      content?: {
        baseSpellIds: SpellType[];
        spellsById: Record<string, SpellMeta>;
        monsterAbilitiesById?: Record<string, MonsterAbilityMeta>;
      };
    }
  | { type: 'TAKE_CARD_TO_HAND'; cardId: string; hand: 'left' | 'right' | 'backpack' }
  | { type: 'INTERACT_WITH_MONSTER'; monsterId: string; target: 'player' | 'shield_left' | 'shield_right' | 'weapon_left' | 'weapon_right' }
  | { type: 'USE_SPELL_ON_TARGET'; spellCardId: string; targetId: string }
  | { type: 'SELL_ITEM'; cardId: string }
  | { type: 'RESET_HAND' }
  | { type: 'CHECK_ROUND_END' }
  | { type: 'CLEAR_PEEK' }
  | { type: 'CLEAR_SCOUT' }
  | { type: 'MERCHANT_LEAVE' }
  | { type: 'MERCHANT_BUY'; offerId: string; targetHand: 'left' | 'right' | 'backpack' }
  | { type: 'USE_BRAVERY_POTION'; potionCardId: string }
  | { type: 'CAST_PRAYER'; prayerCardId: string; targetSpellCardId: string }
  | { type: 'ACTIVATE_CURSE'; curse: CurseType; curseMeta?: CurseMeta };

export const MAX_HP = 13;
