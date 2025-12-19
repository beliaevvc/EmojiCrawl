// Доменный reducer (Domain).
// Чистая функция управления состоянием игры.
// Не зависит от React/UI/Supabase/LocalStorage.
//
// Важная граница (Clean Architecture):
// - домен НЕ должен импортить статический контент напрямую (`src/data/*` / `src/content/*`),
// - но домен может принимать “данные отображения” как вход (например через action),
//   если это требуется для инициализации/логов, не влияя на механику.
//
// Блок 4 (Content Layer):
// - `START_GAME` может содержать `action.content` (snapshot данных для spell/abilities),
// - `ACTIVATE_CURSE` может содержать `action.curseMeta` для текста лога.

import { GameState, GameAction, LogEntry, Overheads, GameStats, Card, SpellType, MonsterAbilityType, HpUpdate, CurseType } from '../model/types';
import { createDeck, shuffleDeck } from '../deck/deckFactory';
import type { Clock } from '../ports/Clock';
import type { Rng } from '../ports/Rng';

export type GameDomainDeps = {
  rng: Rng;
  clock: Clock;
};

const createId = (rng: Rng, length = 9) => {
  // `toString(36)` может дать строку короче нужной длины — добираем в цикле.
  let s = '';
  while (s.length < length) {
    s += rng.nextFloat().toString(36).slice(2);
  }
  return s.slice(0, length);
};

const pickIndex = (rng: Rng, length: number) => {
  if (length <= 0) return 0;
  return Math.floor(rng.nextFloat() * length);
};

const shuffle = <T,>(items: T[], rng: Rng): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextFloat() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const createInitialStats = (clock: Clock): GameStats => ({
  monstersKilled: 0,
  coinsCollected: 0,
  hpHealed: 0,
  damageDealt: 0,
  damageBlocked: 0,
  damageTaken: 0,
  resetsUsed: 0,
  itemsSold: 0,
  startTime: clock.now(),
  endTime: null,
  runType: 'standard',
});

// Начальное состояние (фабрика): зависит от Clock, чтобы не использовать `Date.now()` в домене.
export const createInitialState = ({ clock }: { clock: Clock }): GameState => ({
  deck: [],
  discardPile: [],
  enemySlots: [null, null, null, null],
  leftHand: { card: null, blocked: false },
  rightHand: { card: null, blocked: false },
  backpack: { card: null, blocked: false },
  player: {
    hp: 13, // Стандартный максимум HP = 13
    maxHp: 13,
    coins: 0,
  },
  round: 1,
  status: 'playing',
  logs: [],
  overheads: { overheal: 0, overdamage: 0, overdef: 0 },
  stats: createInitialStats(clock),
  activeEffects: [],
  peekCards: null,
  peekType: undefined,
  scoutCards: null,
  isGodMode: false,
  hpUpdates: [],
  curse: null,
  hasActed: false,
  merchant: {
    willAppear: false,
    scheduledRound: null,
    hasAppeared: false,
    isActive: false,
    blockedSlotIndex: null,
    offers: [],
    overlaySlots: [null, null, null, null],
    saleUsed: false,
    hasBought: false,
    forceOpenNextRound: false,
  },
});

// Вспомогательные функции
export const createGameReducer = ({ rng, clock }: GameDomainDeps) => {
  const initialState = createInitialState({ clock });
  const initialStats = initialState.stats;

  const createLog = (message: string, type: LogEntry['type']): LogEntry => ({
    id: createId(rng),
    message,
    type,
    timestamp: clock.now(),
  });

  const addLog = (state: GameState, message: string, type: LogEntry['type']): GameState => {
    const newLogs = [createLog(message, type), ...state.logs].slice(0, 50); // Храним только последние 50 логов
    return { ...state, logs: newLogs };
  };

  const createMerchantOfferCards = (): Card[] => {
    // Партия 1: товары пока “витрина” (покупка/эффекты добавим следующей партией).
    // Уже сейчас важно: иконки/названия/описания должны совпадать с ТЗ, чтобы UX можно было проверить.
    const price = 15;
    return [
      {
        id: `merchant_bravery_${createId(rng, 5)}`,
        type: 'spell',
        value: 0,
        icon: '🦁',
        name: 'Зелье Храбрости',
        description: 'Цена: 15💎. Использование: -4 HP, затем +2 max HP.',
        merchantOfferType: 'bravery_potion',
        merchantPrice: price,
      } as any,
      {
        id: `merchant_claymore_${createId(rng, 5)}`,
        type: 'weapon',
        value: 6,
        icon: '🗡️',
        name: 'Клеймор',
        description: 'Цена: 15💎. Оружие с прочностью (как щит).',
        merchantOfferType: 'claymore',
        merchantPrice: price,
      } as any,
      {
        id: `merchant_prayer_${createId(rng, 5)}`,
        type: 'spell',
        value: 0,
        icon: '📜',
        name: 'Молитва',
        description: 'Цена: 15💎. Дублирует выбранный спелл в рюкзак.',
        merchantOfferType: 'prayer',
        merchantPrice: price,
      } as any,
    ];
  };

  const createMerchantLeaveToken = (): Card => {
    return {
      id: `merchant_leave_${createId(rng, 5)}`,
      type: 'coin',
      value: 0,
      icon: '🚪',
      name: 'Уйти',
      description: 'Закрыть торговца и продолжить раунд.',
      merchantAction: 'leave',
    } as any;
  };

  const closeMerchantAndDeal3 = (state: GameState, prevEnemySlotsForSpawnCheck?: (Card | null)[]): GameState => {
    const before = prevEnemySlotsForSpawnCheck ?? state.enemySlots;
    const newSlots = [...state.enemySlots];
    const deck = [...state.deck];

    for (let i = 0; i < 4; i++) {
      if (newSlots[i] === null && deck.length > 0) {
        const cardToDraw = deck.pop();
        if (cardToDraw) newSlots[i] = cardToDraw;
      }
    }

    let s: GameState = {
      ...state,
      deck,
      enemySlots: newSlots,
      merchant: {
        ...state.merchant,
        isActive: false,
        blockedSlotIndex: null,
        offers: [],
        overlaySlots: [null, null, null, null],
        saleUsed: false,
        hasBought: false,
      },
    };

    // Spawn-способности для новых монстров
    s.enemySlots.forEach((c) => {
      if (c && c.type === 'monster' && !before.some((old) => old?.id === c.id)) {
        s = applySpawnAbilities(s, c);
      }
    });

    // Туман: товары торговца не скрываются; применяем только после закрытия и обычного добора.
    if (s.curse === 'fog') {
      const indices = shuffle([0, 1, 2, 3], rng).slice(0, 2);
      const fogSlots = [...s.enemySlots];
      let hiddenCount = 0;
      indices.forEach((i) => {
        if (fogSlots[i]) {
          fogSlots[i] = { ...fogSlots[i]!, isHidden: true };
          hiddenCount++;
        }
      });
      s.enemySlots = fogSlots;
      if (hiddenCount > 0) {
        s = addLog(s, 'ТУМАН: Карты скрыты.', 'info');
      }
    }

    return s;
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

  const setPlayerHp = (state: GameState, newHp: number, source: string): GameState => {
    const update: HpUpdate = {
        from: state.player.hp,
        to: newHp,
        source,
        // Важно: hpUpdates используются UI для очереди анимаций, поэтому нам нужен “уникальный”
        // timestamp. Раньше это было `Date.now() + Math.random()`. Делаем то же, но через порты.
        timestamp: clock.now() + rng.nextFloat()
    };
    
    const newUpdates = [...state.hpUpdates, update].slice(-20);
    
    return {
        ...state,
        player: { ...state.player, hp: newHp },
        hpUpdates: newUpdates
    };
  }

const findCardInSlots = (slots: (any)[], id: string): number => {
  return slots.findIndex(c => c?.id === id);
};

const findCardLocation = (state: GameState, cardId: string): 'leftHand' | 'rightHand' | 'backpack' | 'enemySlots' | null => {
   if (state.leftHand.card?.id === cardId) return 'leftHand';
   if (state.rightHand.card?.id === cardId) return 'rightHand';
   if (state.backpack.card?.id === cardId) return 'backpack';
   if (state.enemySlots.some(c => c?.id === cardId)) return 'enemySlots';
   return null;
}

const removeCardFromSource = (state: GameState, cardId: string): { newState: GameState, card: any, fromWhere: 'enemySlots' | 'backpack' | 'leftHand' | 'rightHand' | null } => {
  const newState = { ...state };
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
  
  if (newState.backpack.card?.id === cardId) {
    card = newState.backpack.card;
    newState.backpack = { ...newState.backpack, card: null };
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

// Проверка активных пассивных способностей (есть ли такой монстр на поле)
const hasActiveAbility = (state: GameState, ability: MonsterAbilityType): boolean => {
    return state.enemySlots.some(c => c?.type === 'monster' && c.ability === ability);
};

// Применение on-spawn способностей (срабатывают при появлении монстра)
const applySpawnAbilities = (state: GameState, card: Card): GameState => {
    let newState = { ...state, player: { ...state.player } };
    if (!card.ability) return newState;

    switch (card.ability) {
        case 'ambush':
            if (!newState.isGodMode) {
                newState = setPlayerHp(newState, Math.max(0, newState.player.hp - 1), 'ambush');
            }
            newState = addLog(newState, `ЗАСАДА (${card.icon}): Герой получил 1 урон при появлении монстра.${newState.isGodMode ? ' (GOD)' : ''}`, 'combat');
            break;
        case 'corpseeater': {
            const bonusHp = newState.discardPile.filter(c => c.type === 'coin').length;
            if (bonusHp > 0) {
                const slotIdx = newState.enemySlots.findIndex(c => c?.id === card.id);
                if (slotIdx !== -1) {
                    const newCard = { ...card, value: card.value + bonusHp, maxHealth: (card.maxHealth || card.value) + bonusHp };
                    const newSlots = [...newState.enemySlots];
                    newSlots[slotIdx] = newCard;
                    newState.enemySlots = newSlots;
                    
                    const newEffect = { type: 'corpseeater', targetId: card.id, value: bonusHp, timestamp: clock.now() };
                    const prevEffects = Array.isArray(newState.lastEffect) ? newState.lastEffect : (newState.lastEffect ? [newState.lastEffect] : []);
                    newState.lastEffect = [...prevEffects, newEffect];

                    newState = addLog(newState, `ТРУПОЕД (${card.icon}): +${bonusHp} HP за кристаллы в сбросе.`, 'info');
                }
            }
            break;
        }
        case 'exhaustion':
            newState.player.maxHp = Math.max(1, newState.player.maxHp - 1);
            if (newState.player.hp > newState.player.maxHp) {
                newState = setPlayerHp(newState, newState.player.maxHp, 'exhaustion_clamp');
            }
            newState = addLog(newState, `ИЗНУРЕНИЕ (${card.icon}): Макс. HP снижено на 1.`, 'info');
            break;
    }
    return newState;
};

// Обработка on-kill способностей (срабатывают при смерти монстра)
const applyKillAbilities = (state: GameState, monster: Card, _killer?: 'weapon' | 'spell' | 'other'): GameState => {
    let newState = { ...state, player: { ...state.player } };
    
    // --- Проклятие: Полнолуние ---
    if (newState.curse === 'full_moon') {
        const otherMonsters = newState.enemySlots
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c && c.type === 'monster' && c.id !== monster.id) as { c: Card, i: number }[];
        
        if (otherMonsters.length > 0) {
            const newSlots = [...newState.enemySlots];
            let healedAny = false;
            otherMonsters.forEach(({ c, i }) => {
                const maxHp = c.maxHealth || c.value;
                if (c.value < maxHp) {
                    newSlots[i] = { ...c, value: Math.min(maxHp, c.value + 1) };
                    healedAny = true;
                }
            });
            if (healedAny) {
                newState.enemySlots = newSlots;
                newState = addLog(newState, 'ПОЛНОЛУНИЕ: Другие монстры исцелились (+1 HP).', 'info');
            }
        }
    }
    // -----------------------------

    // Глобальный эффект: Trophy (любое убийство даёт 💎)
    if (newState.activeEffects.includes('trophy')) {
        newState.activeEffects = newState.activeEffects.filter(e => e !== 'trophy');
        newState.player.coins += 2;
        newState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + 2 });
        newState = addLog(newState, 'ТРОФЕЙ: +2 💎 за убийство монстра.', 'gain');
    }
    
    // Глобальный триггер: Parasite (другие монстры лечатся)
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
        case 'whisper': {
            const nextCard = newState.deck[newState.deck.length - 1];
            if (nextCard) {
                newState.peekCards = [nextCard];
                newState.peekType = 'whisper';
                newState = addLog(newState, `ШЕПОТ ЛЕСА: Показана следующая карта.`, 'info');
            } else {
                newState = addLog(newState, `ШЕПОТ ЛЕСА: Колода пуста.`, 'info');
            }
            break;
        }
        case 'breach': {
            // Сбрасываем случайный щит
            const shields = [];
            if (newState.leftHand.card?.type === 'shield') shields.push('leftHand');
            if (newState.rightHand.card?.type === 'shield') shields.push('rightHand');
            if (newState.backpack.card?.type === 'shield') shields.push('backpack');
            
            if (shields.length > 0) {
                const targetLoc = shields[pickIndex(rng, shields.length)];
                if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
                else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
                else if (targetLoc === 'backpack') newState.backpack = { ...newState.backpack, card: null };
                newState = addLog(newState, 'ПРОЛОМ: Щит уничтожен.', 'combat');
            }
            break;
        }
        case 'disarm': {
            const weapons = [];
            if (newState.leftHand.card?.type === 'weapon') weapons.push('leftHand');
            if (newState.rightHand.card?.type === 'weapon') weapons.push('rightHand');
            if (newState.backpack.card?.type === 'weapon') weapons.push('backpack');
            
            if (weapons.length > 0) {
                const targetLoc = weapons[pickIndex(rng, weapons.length)];
                if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
                else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
                else if (targetLoc === 'backpack') newState.backpack = { ...newState.backpack, card: null };
                newState = addLog(newState, 'ОБЕЗОРУЖИВАНИЕ: Оружие выбито.', 'combat');
            }
            break;
        }
        case 'blessing': {
            if (newState.player.hp <= 0) {
                 newState = addLog(newState, `БЛАГОСЛОВЕНИЕ: не сработало (герой погиб).`, 'info');
                 break;
            }
            const heal = 2;
            const newHp = Math.min(newState.player.maxHp, newState.player.hp + heal);
            newState = setPlayerHp(newState, newHp, 'blessing');
            newState = addLog(newState, `БЛАГОСЛОВЕНИЕ: +${heal} HP.`, 'heal');
            break;
        }
        case 'beacon': {
             // Ищем следующего монстра “сверху” колоды (конец массива)
             const nextMonster = [...newState.deck].reverse().find(c => c.type === 'monster');
             if (nextMonster) {
                 newState.peekCards = [nextMonster];
                 newState.peekType = 'beacon';
                 newState = addLog(newState, 'МАЯК: Обнаружен следующий монстр.', 'info');
             } else {
                 newState = addLog(newState, 'МАЯК: Монстров больше нет.', 'info');
             }
             break;
        }
        case 'bones': {
            const skullCard: Card = {
                id: `skull_${createId(rng, 5)}`,
                type: 'skull',
                value: 0,
                icon: '💀',
                name: 'Кости',
                description: 'Бесполезные останки.'
            };
            
            // Вставляем в случайную позицию в колоде
            const insertIdx = pickIndex(rng, newState.deck.length + 1);
            const newDeck = [...newState.deck];
            newDeck.splice(insertIdx, 0, skullCard);
            newState.deck = newDeck;
            
            newState = addLog(newState, 'КОСТИ: Череп замешан в колоду.', 'info');
            break;
        }
        case 'legacy': {
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
        }
        case 'theft': {
            const items = [];
            if (newState.leftHand.card) items.push('leftHand');
            if (newState.rightHand.card) items.push('rightHand');
            if (newState.backpack.card) items.push('backpack');
            
            if (items.length > 0) {
                const targetLoc = items[pickIndex(rng, items.length)];
                if (targetLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
                else if (targetLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
                else if (targetLoc === 'backpack') newState.backpack = { ...newState.backpack, card: null };
                newState = addLog(newState, 'ПОХИЩЕНИЕ: предмет украден!', 'combat');
            }
            break;
        }
        case 'corrosion': {
            const invItems = [];
            if (newState.leftHand.card) invItems.push(newState.leftHand.card);
            if (newState.rightHand.card) invItems.push(newState.rightHand.card);
            if (newState.backpack.card) invItems.push(newState.backpack.card);
            
            const validInv = invItems.filter(c => c.value > 0);
            if (validInv.length > 0) {
                const target = validInv[pickIndex(rng, validInv.length)];
                const newVal = Math.max(0, target.value - 2);
                
                // Нужно найти, где лежит выбранная карта, чтобы обновить значение (рука/рюкзак)
                let logMsg = '';
                
                const applyDamage = (currentCard: Card) => {
                    if (newVal <= 0) {
                        newState.discardPile = [...newState.discardPile, { ...currentCard, value: 0 }];
                        logMsg = `КОРРОЗИЯ: ${currentCard.icon} разрушен!`;
                        return null;
                    } else {
                        logMsg = `КОРРОЗИЯ: ${currentCard.icon} ослаблен (-2).`;
                        return { ...currentCard, value: newVal };
                    }
                };

                if (newState.leftHand.card?.id === target.id) {
                    newState.leftHand.card = applyDamage(target);
                } else if (newState.rightHand.card?.id === target.id) {
                    newState.rightHand.card = applyDamage(target);
                } else if (newState.backpack.card?.id === target.id) {
                    newState.backpack = { ...newState.backpack, card: applyDamage(target) };
                }
                
                newState.lastEffect = { type: 'corrosion', targetId: target.id, value: -2, timestamp: clock.now() };
                newState = addLog(newState, logMsg, 'combat');
            }
            break;
        }
        case 'exhaustion':
            // При убийстве монстра с “Изнурением” возвращаем часть max HP
            newState.player.maxHp = Math.min(13, newState.player.maxHp + 1); 
            newState = setPlayerHp(newState, Math.min(newState.player.maxHp, newState.player.hp + 1), 'exhaustion_restore');
            newState = addLog(newState, 'ИЗНУРЕНИЕ: Макс. HP восстановлено (+1 HP).', 'info');
            break;
        case 'junk': {
            const junkSkull: Card = {
                id: `junk_skull_${createId(rng, 5)}`,
                type: 'skull',
                value: 0,
                icon: '💀',
                name: 'Кости',
                description: 'Бесполезные останки.'
            };
            
            if (!newState.backpack.card && !newState.backpack.blocked && !hasActiveAbility(newState, 'web')) {
                newState.backpack = { ...newState.backpack, card: junkSkull };
                newState = addLog(newState, 'ХЛАМ: Кости добавлены в рюкзак.', 'info');
            } else {
                newState = addLog(newState, 'ХЛАМ: Рюкзак полон или заблокирован.', 'info');
            }
            break;
        }
        case 'miss':
            // Дебафф: ослабляем следующую атаку игрока
            newState.activeEffects = [...newState.activeEffects, 'miss']; 
            newState = addLog(newState, 'ПРОМАХ: Следующая атака слабее.', 'combat');
            break;
    }
    return newState;
};

// Обновление монстров “Зеркало” (mirror)
const updateMirrorMonsters = (state: GameState): GameState => {
    // Считаем максимальный урон оружия (учитывая проклятие “Закалка”)
    let maxDmg = 0;
    const temperingBonus = state.curse === 'tempering' ? 1 : 0;
    if (state.leftHand.card?.type === 'weapon' || state.leftHand.card?.type === 'claymore')
      maxDmg = Math.max(maxDmg, state.leftHand.card.value + temperingBonus);
    if (state.rightHand.card?.type === 'weapon' || state.rightHand.card?.type === 'claymore')
      maxDmg = Math.max(maxDmg, state.rightHand.card.value + temperingBonus);
    if (state.backpack.card?.type === 'weapon' || state.backpack.card?.type === 'claymore')
      maxDmg = Math.max(maxDmg, state.backpack.card.value + temperingBonus);

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

// Логика атаки монстра
const handleMonsterAttack = (state: GameState, monster: any, defenseType: 'body' | 'shield', shieldHand?: 'left' | 'right'): { state: GameState, log?: string, logType?: LogEntry['type'], monsterKept?: boolean } => {
    let newState = { ...state };
    const damage = monster.value;
    let log = '';
    const logType: LogEntry['type'] = 'combat';

    if (defenseType === 'body') {
        // Проверка эффекта “Доспех” (armor): полностью блокирует следующий удар
        if (state.activeEffects.includes('armor')) {
            newState.activeEffects = state.activeEffects.filter(e => e !== 'armor');
            log = `Доспехи заблокировали удар монстра (${damage} урона)!`;
            return { state: newState, log, logType: 'info' };
        }

        // Проверка эффекта “Отвод” (deflection): отражаем удар в монстра
        if (state.activeEffects.includes('deflection')) {
            newState.activeEffects = state.activeEffects.filter(e => e !== 'deflection');
            
            // Выбираем цель для отражения
            const allMonsters = newState.enemySlots
                .map((c, i) => ({c, i}))
                .filter(item => item.c?.type === 'monster') as {c: Card, i: number}[];
            
            const otherMonsters = allMonsters.filter(item => item.c.id !== monster.id);
            
            let targetIdx: number;
            let targetMonster: Card;

            if (otherMonsters.length > 0) {
                // Бьём случайного другого монстра
                const target = otherMonsters[pickIndex(rng, otherMonsters.length)];
                targetIdx = target.i;
                targetMonster = target.c;
            } else {
                // Бьём себя (если других монстров нет)
                const selfEntry = allMonsters.find(item => item.c.id === monster.id);
                if (!selfEntry) return { state: newState }; // Не должно происходить
                targetIdx = selfEntry.i;
                targetMonster = selfEntry.c;
            }

            // Применяем урон
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
            
            return { state: newState, log, logType: 'combat', monsterKept: true };
        }

        if (newState.isGodMode) {
             log = `Получен урон от монстра: -${damage} HP (GOD MODE: Урон заблокирован)`;
        } else {
            newState = setPlayerHp(newState, Math.max(0, newState.player.hp - damage), 'monster_attack');
            newState = updateStats(newState, { damageTaken: newState.stats.damageTaken + damage });
            log = `Получен урон от монстра: -${damage} HP`;
        }

    } else if (defenseType === 'shield' && shieldHand) {
        const hand = shieldHand === 'left' ? newState.leftHand : newState.rightHand;
        const shield = hand.card;
        
        if (!shield || shield.type !== 'shield') return { state };

        // Способность “Топот” (trample): ломает щит мгновенно
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
            if (newState.isGodMode) {
                log += ` Прошло урона: -${overflow} HP (GOD MODE: Урон заблокирован)`;
            } else {
                newState = setPlayerHp(newState, Math.max(0, newState.player.hp - overflow), 'monster_attack_overflow');
                log += ` Прошло урона: -${overflow} HP`;
            }
        }
    }
    return { state: newState, log, logType };
}

const handleWeaponAttack = (state: GameState, monster: any, monsterIdx: number, weaponHand: 'left' | 'right'): { state: GameState, log?: string, logType?: LogEntry['type'] } => {
    let newState = { ...state };
    const hand = weaponHand === 'left' ? newState.leftHand : newState.rightHand;
    const weapon = hand.card;

    if (!weapon || (weapon.type !== 'weapon' && weapon.type !== 'claymore')) return { state };

    let damage = weapon.value;
    if (newState.curse === 'tempering') {
        damage += 1;
    }
    
    // Эффект “Промах” (дебафф на игроке): -2 к следующей атаке оружием
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
        
        // Применяем on-kill способности (монстр ещё НЕ в discard pile)
        newState = applyKillAbilities(newState, monster, 'weapon');

        // Кладём в discard pile ПОСЛЕ срабатывания on-kill способностей
        newState.discardPile = [...newState.discardPile, monster];

    } else {
        const newMonsterHp = monsterHp - damage;
        
        // Проверка способности “БЕГСТВО” (flee)
        if (monster.ability === 'flee' && newMonsterHp <= 3) {
            const newSlots = [...newState.enemySlots];
            newSlots[monsterIdx] = null;
            newState.enemySlots = newSlots;
            // Возвращаем монстра в колоду (с обновлённым HP) и перемешиваем
            newState.deck = shuffleDeck([...newState.deck, { ...monster, value: newMonsterHp }], rng);
            log = `Монстр получил урон ${damage}, но сбежал в колоду с ${newMonsterHp} HP (БЕГСТВО)!`;
        } else {
            const newMonster = { ...monster, value: newMonsterHp };
            const newSlots = [...newState.enemySlots];
            newSlots[monsterIdx] = newMonster;
            newState.enemySlots = newSlots;
            log = `Монстру нанесено ${damage} урона.`;
        }
    }

    // Claymore: оружие с прочностью (остаётся в руке и теряет прочность на HP монстра ДО удара).
    if (weapon.type === 'claymore') {
      const durabilityCost = monsterHp; // по ТЗ: тратим по HP монстра до удара
      const newDurability = Math.max(0, weapon.value - durabilityCost);
      if (newDurability === 0) {
        if (weaponHand === 'left') newState.leftHand = { ...newState.leftHand, card: null };
        else newState.rightHand = { ...newState.rightHand, card: null };
        newState.discardPile = [...newState.discardPile, { ...weapon, value: 0 }];
        log += ` КЛЕЙМОР: сломан (потеряно ${durabilityCost} прочности).`;
      } else {
        const updatedClaymore = { ...weapon, value: newDurability };
        if (weaponHand === 'left') newState.leftHand = { ...newState.leftHand, card: updatedClaymore };
        else newState.rightHand = { ...newState.rightHand, card: updatedClaymore };
        log += ` КЛЕЙМОР: осталось ${newDurability} прочности (-${durabilityCost}).`;
      }
    } else {
      if (weaponHand === 'left') newState.leftHand = { ...newState.leftHand, card: null };
      else newState.rightHand = { ...newState.rightHand, card: null };
      newState.discardPile = [...newState.discardPile, weapon];
    }

    return { state: newState, log, logType: 'combat' };
}

  return (state: GameState, action: GameAction): GameState => {
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
                 stats: { ...s.stats, endTime: clock.now() }
             };
         }
         return s;
     }

     if (cardsOnTable <= 1 && !deckEmpty) {
          const newSlots = [...s.enemySlots];
          const deck = [...s.deck];

          const clearUsedHand = (hand: any): any => {
             if (hand.blocked) {
                 return { card: null, blocked: false };
             }
             return { ...hand, blocked: false };
          };

          let newState: GameState = {
             ...s,
             deck,
             enemySlots: newSlots,
             leftHand: clearUsedHand(s.leftHand),
             rightHand: clearUsedHand(s.rightHand),
             backpack: clearUsedHand(s.backpack),
             round: s.round + 1
          };

          // Traveling Merchant (Variant B / overlay):
          // - показываем только если на столе была РОВНО 1 карта (при 0 карт торговец не приходит),
          // - показываем в начале нового раунда (после round++).
          const baseMerchantGate =
            !s.merchant.hasAppeared &&
            s.merchant.willAppear &&
            s.merchant.scheduledRound != null &&
            // Важно: если в запланированный раунд переход произошёл при 0 карт,
            // торговец по ТЗ не может появиться. Поэтому открываем его при первом подходящем переходе
            // (ровно 1 карта) на или после запланированного раунда.
            newState.round >= s.merchant.scheduledRound;

          const shouldOpenMerchant = (cardsOnTable === 1 && baseMerchantGate) || (s.merchant.forceOpenNextRound && baseMerchantGate);

          if (shouldOpenMerchant) {
            const blockedSlotIndex = newSlots.findIndex((c) => c !== null);
            const offers = createMerchantOfferCards();
            const leave = createMerchantLeaveToken();
            const overlaySlots: (Card | null)[] = [null, null, null, null];

            // В слоте с последней картой показываем “🚪 Уйти”, остальные 3 — товары.
            if (blockedSlotIndex !== -1) {
              overlaySlots[blockedSlotIndex] = leave;
            }

            const emptyIndices = [0, 1, 2, 3].filter((idx) => idx !== blockedSlotIndex);
            for (let i = 0; i < emptyIndices.length; i++) {
              overlaySlots[emptyIndices[i]] = offers[i] ?? null;
            }

            newState = {
              ...newState,
              merchant: {
                ...newState.merchant,
                hasAppeared: true,
                isActive: true,
                blockedSlotIndex,
                offers,
                overlaySlots,
                saleUsed: false,
                hasBought: false,
                forceOpenNextRound: false,
              },
            };

            return addLog(newState, `ТОРГОВЕЦ: прибыл (раунд ${newState.round}).`, 'info');
          }

          // Обычный добор (если торговец не активировался).
          for (let i = 0; i < 4; i++) {
            if (newSlots[i] === null && deck.length > 0) {
              let cardToDraw: Card | undefined;
              if (!cardToDraw) cardToDraw = deck.pop();
              if (cardToDraw) {
                newSlots[i] = cardToDraw;
              }
            }
          }
          newState.enemySlots = newSlots;
          
          // Применяем spawn-способности для НОВЫХ карт (которых не было на столе в прошлом состоянии)
          newState.enemySlots.forEach((c) => {
              if (c && c.type === 'monster' && !s.enemySlots.some(old => old?.id === c.id)) {
                  newState = applySpawnAbilities(newState, c);
              }
          });

          // --- Curse Logic: Fog (Deal Round) ---
          if (newState.curse === 'fog') {
              // Скрываем 2 случайные карты (Туман)
              const indices = shuffle([0, 1, 2, 3], rng).slice(0, 2);
              const fogSlots = [...newState.enemySlots];
              let hiddenCount = 0;
              indices.forEach(i => {
                  if (fogSlots[i]) {
                      fogSlots[i] = { ...fogSlots[i]!, isHidden: true };
                      hiddenCount++;
                  }
              });
              newState.enemySlots = fogSlots;
              if (hiddenCount > 0) {
                  newState = addLog(newState, 'ТУМАН: Карты скрыты.', 'info');
              }
          }
          // -------------------------------------

          return addLog(newState, `Раунд ${newState.round} начался.`, 'info');
     }
     
     // --- Curse Logic: Fog (Reveal) ---
     if (s.curse === 'fog' && cardsOnTable <= 2) {
         // Проверяем, есть ли на столе скрытые карты
         const hasHidden = s.enemySlots.some(c => c && c.isHidden);
         if (hasHidden) {
             const newSlots = s.enemySlots.map(c => c ? { ...c, isHidden: false } : null);
             return addLog({ ...s, enemySlots: newSlots }, 'Туман рассеивается...', 'info');
         }
     }
     // ---------------------------------
     
     if (cardsOnTable <= 1 && deckEmpty) {
         const clearUsedHand = (hand: any): any => {
             if (hand.card?.type === 'coin' || hand.card?.type === 'potion' || hand.card?.type === 'skull') {
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

  /**
   * Traveling Merchant: во время торговца игра находится в “режиме магазина”.
   *
   * Правила (по ТЗ):
   * - запрещены боевые взаимодействия и касты,
   * - запрещён сброс,
   * - разрешено “🚪 Уйти”,
   * - разрешена ровно 1 продажа предмета из рюкзака.
   *
   * Примечание: покупка/артефакты будут следующей партией. Сейчас “витрина + уйти + 1 продажа”.
   */
  if (state.merchant.isActive) {
    // Важно: во время торговца блокируем только "игровые" действия боя/магии/сброса и т.п.,
    // но системные команды (например "Новая игра") должны работать всегда.
    const allowed =
      action.type === 'MERCHANT_LEAVE' ||
      action.type === 'MERCHANT_BUY' ||
      action.type === 'SELL_ITEM' ||
      action.type === 'START_GAME' ||
      action.type === 'INIT_GAME' ||
      action.type === 'TOGGLE_GOD_MODE' ||
      action.type === 'CHEAT_ADD_COINS' ||
      action.type === 'CHEAT_SCHEDULE_MERCHANT_NEXT_ROUND';
    if (!allowed) {
      // Не спамим лог каждый раз — в партии 1 достаточно просто блокировать.
      return state;
    }
  }

  switch (action.type) {
    case 'INIT_GAME':
      return createInitialState({ clock });
      
    case 'TOGGLE_GOD_MODE':
      nextState = { ...state, isGodMode: !state.isGodMode };
      logMessage = nextState.isGodMode ? '👑 РЕЖИМ БОГА ВКЛЮЧЕН' : 'РЕЖИМ БОГА ВЫКЛЮЧЕН';
      break;

    case 'CHEAT_ADD_COINS': {
      const amount = Number.isFinite(action.amount) ? Math.trunc(action.amount) : 0;
      if (amount === 0) return state;
      const nextCoins = Math.max(0, state.player.coins + amount);
      nextState = { ...state, player: { ...state.player, coins: nextCoins } };
      logMessage = `🧪 ЧИТ: ${amount > 0 ? '+' : ''}${amount} 💎 (итого ${nextCoins}).`;
      logType = 'info';
      break;
    }

    case 'CHEAT_SCHEDULE_MERCHANT_NEXT_ROUND': {
      const scheduledRound = state.round + 1;
      nextState = {
        ...state,
        merchant: {
          ...state.merchant,
          willAppear: true,
          scheduledRound,
          hasAppeared: false,
          forceOpenNextRound: true,
        },
      };
      logMessage = `🧪 ЧИТ: торговец запланирован на следующий раунд (раунд ${scheduledRound}).`;
      logType = 'info';
      break;
    }

    case 'ACTIVATE_CURSE': {
        nextState = { ...state, curse: action.curse };
        // Блок 4: имя проклятия для лога приходит из application слоя (curseMeta),
        // чтобы domain не импортил content напрямую.
        const curseName = action.curseMeta?.name ?? action.curse;
        logMessage = `ПРОКЛЯТИЕ: ${curseName} активировано!`;
        logType = 'info';
        
        // Начальный эффект “Тумана”, если активировали в середине (например старт забега, раунд 1)
        if (action.curse === 'fog' && state.round === 1) {
             // Сразу скрываем 2 случайные карты
              const indices = shuffle([0, 1, 2, 3], rng).slice(0, 2);
              const fogSlots = [...nextState.enemySlots];
              indices.forEach(i => {
                  if (fogSlots[i]) {
                      fogSlots[i] = { ...fogSlots[i]!, isHidden: true };
                  }
              });
              nextState.enemySlots = fogSlots;
        }
        break;
    }

    case 'START_GAME': {
      const runType = action.runType || 'standard';
      let newDeck: Card[] = [];

      if (runType === 'custom' && action.deckConfig) {
          // Блок 4: создаём “базовую” колоду с учётом content snapshot (spell meta),
          // чтобы получить дефолтных монстров и корректные spell-карты без импортов `data/*`.
          const baseDeck = createDeck(
            {
              baseSpellIds: action.content?.baseSpellIds,
              spellsById: action.content?.spellsById,
            },
            rng
          );
          const baseMonsters = baseDeck.filter(c => c.type === 'monster');
          
          const { shields, weapons, potions, coins, spells, monsters } = action.deckConfig;

          const customShields: Card[] = shields.map((val, idx) => ({
              id: `shield_custom_${idx}_${createId(rng, 5)}`,
              type: 'shield',
              value: val,
              icon: '🛡️',
              name: 'Щит',
              description: `Поглощает ${val} урона.`
          }));

          const customWeapons: Card[] = weapons.map((val, idx) => ({
              id: `weapon_custom_${idx}_${createId(rng, 5)}`,
              type: 'weapon',
              value: val,
              icon: '⚔️',
              name: 'Оружие',
              description: `Наносит ${val} урона.`
          }));

          const customPotions: Card[] = potions.map((val, idx) => ({
              id: `potion_custom_${idx}_${createId(rng, 5)}`,
              type: 'potion',
              value: val,
              icon: '🧪',
              name: 'Зелье',
              description: `Восстанавливает ${val} HP.`
          }));

          const customCoins: Card[] = coins.map((val, idx) => ({
              id: `coin_custom_${idx}_${createId(rng, 5)}`,
              type: 'coin',
              value: val,
              icon: '💎',
              name: 'Кристалл',
              description: `Дает ${val} монет.`
          }));

          const customSpells: Card[] = spells.map((spellId, idx) => {
              const def = action.content?.spellsById?.[spellId];
              return {
                  id: `spell_custom_${idx}_${createId(rng, 5)}`,
                  type: 'spell',
                  spellType: spellId,
                  value: 0,
                  icon: def ? def.icon : '📜',
                  name: def ? def.name : 'Заклинание',
                  description: def ? def.description : ''
              };
          });

          let generatedMonsters: Card[] = [];
          if (monsters && monsters.length > 0) {
              monsters.forEach(group => {
                  // Блок 4: ability meta для подписи карточки “монстра” берём из content snapshot,
                  // чтобы не импортить `data/monsterAbilities` в домене.
                  const abilityDef = group.ability ? action.content?.monsterAbilitiesById?.[group.ability] : null;
                  for (let i = 0; i < group.count; i++) {
                      generatedMonsters.push({
                          id: `monster_${group.value}_${i}_${createId(rng, 5)}`,
                          type: 'monster',
                          value: group.value,
                          maxHealth: group.value,
                          icon: '🐺', 
                          ability: group.ability,
                          label: group.label,
                          name: abilityDef ? abilityDef.name : `Монстр ${group.value}`,
                          description: abilityDef ? abilityDef.description : undefined
                      });
                  }
              });
          } else {
              generatedMonsters = baseMonsters;
          }

          newDeck = shuffleDeck(
            [...generatedMonsters, ...customShields, ...customWeapons, ...customPotions, ...customCoins, ...customSpells],
            rng
          );
      } else {
          // Обычный старт: создаём стандартную колоду (внутри createDeck всё уже “умеет” брать meta из content snapshot).
          newDeck = createDeck(
            {
              baseSpellIds: action.content?.baseSpellIds,
              spellsById: action.content?.spellsById,
            },
            rng
          );
      }

      const enemySlots = [null, null, null, null] as (any | null)[];

      for (let i = 0; i < 4; i++) {
        if (newDeck.length > 0) {
          const card = newDeck.pop() || null;
          enemySlots[i] = card;
        }
      }
      
      let playerHp = 13;
      let playerCoins = 0;
      let startingCurse: CurseType | null = null;
      
      if (runType === 'custom' && action.deckConfig) {
          playerHp = action.deckConfig.character.hp;
          playerCoins = action.deckConfig.character.coins;
          startingCurse = action.deckConfig.curse || null;
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
        backpack: { card: null, blocked: false },
        round: 1,
        logs: [createLog("Новая игра началась!", 'info')],
        overheads: { overheal: 0, overdamage: 0, overdef: 0 },
        stats: { ...initialStats, startTime: clock.now(), runType: runType, templateName: action.templateName },
        activeEffects: [],
        curse: startingCurse,
        hasActed: false,
        merchant: {
          ...initialState.merchant,
          willAppear: rng.nextFloat() < 0.4,
          scheduledRound: null,
        },
      };

      // Планируем раунд появления торговца (если он должен появиться).
      // Важно: на переходе раунда мы добираем ДО 4 карт (если на столе 0 карт) или 3 (если осталась 1 карта).
      // Поэтому для планирования берём консервативную оценку по 4 картам за раунд, чтобы не выбрать “несуществующий” раунд.
      if (nextState.merchant.willAppear) {
        const estimatedMaxRound = 1 + Math.ceil(nextState.deck.length / 4);
        const minRound = 2; // по ТЗ: на 1-м раунде торговец не появляется
        const maxAllowed = Math.max(minRound, estimatedMaxRound - 1); // допускаем “предпоследний”
        const scheduled = minRound + Math.floor(rng.nextFloat() * (maxAllowed - minRound + 1));
        nextState.merchant.scheduledRound = scheduled;
        // Диагностический лог: помогает понять, “почему не выпал”.
        // Важно: торговец откроется только на переходе раунда, когда на столе осталась РОВНО 1 карта.
        nextState = addLog(
          nextState,
          `🎩 ТОРГОВЕЦ: будет в этом забеге. Появится начиная с раунда ${scheduled} (когда на столе останется 1 карта).`,
          'info'
        );
      } else {
        nextState = addLog(nextState, '🎩 ТОРГОВЕЦ: в этом забеге не появится.', 'info');
      }

      // Применяем spawn-способности для стартовой раздачи
      nextState.enemySlots.forEach(c => {
          if (c && c.type === 'monster') {
              nextState = applySpawnAbilities(nextState, c);
          }
      });
      nextState = updateMirrorMonsters(nextState);

      // Начальный “Туман”: на старте скрываем 2 случайные карты
      if (startingCurse === 'fog') {
          const indices = shuffle([0, 1, 2, 3], rng).slice(0, 2);
          const fogSlots = [...nextState.enemySlots];
          indices.forEach(i => {
              if (fogSlots[i]) {
                  fogSlots[i] = { ...fogSlots[i]!, isHidden: true };
              }
          });
          nextState.enemySlots = fogSlots;
          nextState = addLog(nextState, 'ПРОКЛЯТИЕ ТУМАН: Карты скрыты.', 'info');
      }

      break;
    }

    case 'MERCHANT_BUY': {
      if (!state.merchant.isActive) return state;
      if (state.merchant.hasBought) return state;

      const offer = state.merchant.offers.find((o) => o.id === action.offerId);
      if (!offer) return state;

      const price = offer.merchantPrice ?? 15;
      if (state.player.coins < price) {
        return addLog(state, 'ТОРГОВЕЦ: не хватает 💎.', 'info');
      }

      const targetSlot =
        action.targetHand === 'left'
          ? state.leftHand
          : action.targetHand === 'right'
            ? state.rightHand
            : state.backpack;

      if (targetSlot.blocked) {
        return addLog(state, 'ТОРГОВЕЦ: слот заблокирован.', 'info');
      }
      if (targetSlot.card) {
        return addLog(state, 'ТОРГОВЕЦ: слот занят.', 'info');
      }

      // Артефакты, которые реально попадают в инвентарь (эффекты будут следующей партией).
      const createPurchasedArtifact = (): Card | null => {
        switch (offer.merchantOfferType) {
          case 'bravery_potion':
            return {
              id: `bravery_${createId(rng, 7)}`,
              type: 'bravery_potion',
              value: 0,
              icon: '🦁',
              name: 'Зелье Храбрости',
              description: 'Использование: -4 HP, затем +2 max HP. Продажа: 0💎.',
              merchantOfferType: 'bravery_potion',
            };
          case 'claymore':
            return {
              id: `claymore_${createId(rng, 7)}`,
              type: 'claymore',
              value: 6,
              icon: '🗡️',
              name: 'Клеймор',
              description: 'Оружие с прочностью (как щит). Продажа: по текущей прочности.',
              merchantOfferType: 'claymore',
            };
          case 'prayer':
            return {
              id: `prayer_${createId(rng, 7)}`,
              type: 'prayer_spell',
              value: 0,
              icon: '📜',
              name: 'Молитва',
              description: 'Скопировать выбранный спелл в рюкзак. Продать нельзя.',
              merchantOfferType: 'prayer',
            };
          default:
            return null;
        }
      };

      const purchased = createPurchasedArtifact();
      if (!purchased) return state;

      // Списываем деньги и кладём артефакт в выбранный слот.
      let s: GameState = {
        ...state,
        hasActed: true,
        player: { ...state.player, coins: state.player.coins - price },
        merchant: { ...state.merchant, hasBought: true },
      };

      if (action.targetHand === 'left') s = { ...s, leftHand: { ...s.leftHand, card: purchased } };
      else if (action.targetHand === 'right') s = { ...s, rightHand: { ...s.rightHand, card: purchased } };
      else s = { ...s, backpack: { ...s.backpack, card: purchased } };

      // По ТЗ: покупка закрывает магазин сразу, затем обычный добор 3 карт из деки.
      const closed = closeMerchantAndDeal3(s, state.enemySlots);
      return addLog(closed, `ТОРГОВЕЦ: куплено ${purchased.icon} за ${price}💎.`, 'gain');
    }

    case 'USE_BRAVERY_POTION': {
      nextState = { ...state, hasActed: true };

      const loc = findCardLocation(state, action.potionCardId);
      if (loc !== 'leftHand' && loc !== 'rightHand' && loc !== 'backpack') {
        return addLog(state, '🦁 ХРАБРОСТЬ: зелье не найдено.', 'info');
      }

      const slot = loc === 'leftHand' ? state.leftHand : loc === 'rightHand' ? state.rightHand : state.backpack;
      const card = slot.card;
      if (!card || card.type !== 'bravery_potion') {
        return addLog(state, '🦁 ХРАБРОСТЬ: это не зелье храбрости.', 'info');
      }
      if (slot.blocked) {
        return addLog(state, '🦁 ХРАБРОСТЬ: слот заблокирован.', 'info');
      }

      // По ТЗ: сначала -4 HP (в God Mode игнорируем), затем +2 maxHp. Может убить при HP<=4.
      let newState: GameState = { ...state };

      const maxHpAfter = newState.player.maxHp + 2;
      let hpAfter = newState.player.hp;
      if (!newState.isGodMode) {
        hpAfter = Math.max(0, hpAfter - 4);
      }

      newState.player = { ...newState.player, maxHp: maxHpAfter };
      newState = setPlayerHp(newState, Math.min(maxHpAfter, hpAfter), 'bravery_potion');

      // Убираем зелье из слота и кладём в discard (как заклинание).
      if (loc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
      else if (loc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
      else newState.backpack = { ...newState.backpack, card: null };
      newState.discardPile = [...newState.discardPile, card];

      newState.hasActed = true;

      const dmgPart = newState.isGodMode ? ' (GOD: урон игнорируется)' : '';
      const log = `🦁 ХРАБРОСТЬ: -4 HP, +2 max HP.${dmgPart}`;
      return addLog(newState, log, 'combat');
    }

    case 'CAST_PRAYER': {
      nextState = { ...state, hasActed: true };

      // “Молчание” блокирует магию (логика аналогична spell-кастам).
      if (hasActiveAbility(state, 'silence')) {
        return addLog(state, 'МОЛЧАНИЕ: Магия заблокирована!', 'info');
      }

      const prayerLoc = findCardLocation(state, action.prayerCardId);
      if (prayerLoc !== 'leftHand' && prayerLoc !== 'rightHand' && prayerLoc !== 'backpack') {
        return addLog(state, '📜 МОЛИТВА: карта не найдена.', 'info');
      }

      const prayerSlot =
        prayerLoc === 'leftHand' ? state.leftHand : prayerLoc === 'rightHand' ? state.rightHand : state.backpack;
      if (prayerSlot.blocked) {
        return addLog(state, '📜 МОЛИТВА: слот заблокирован.', 'info');
      }
      const prayerCard = prayerSlot.card;
      if (!prayerCard || prayerCard.type !== 'prayer_spell') {
        return addLog(state, '📜 МОЛИТВА: это не “Молитва”.', 'info');
      }

      // Таргет: spell-карта в руке.
      const targetLoc = findCardLocation(state, action.targetSpellCardId);
      if (targetLoc !== 'leftHand' && targetLoc !== 'rightHand') {
        return addLog(state, '📜 МОЛИТВА: цель должна быть заклинанием в руке.', 'info');
      }
      const targetCard = targetLoc === 'leftHand' ? state.leftHand.card : state.rightHand.card;
      if (!targetCard || targetCard.type !== 'spell' || !targetCard.spellType) {
        return addLog(state, '📜 МОЛИТВА: цель должна быть заклинанием.', 'info');
      }

      // Копия строго в рюкзак, только если пуст и не заблокирован (web тоже блокирует).
      // Разрешаем кейс, когда сама “Молитва” лежит в рюкзаке: она “съедается”, а на её место кладём копию.
      const backpackOccupiedByOther =
        !!state.backpack.card && state.backpack.card.id !== action.prayerCardId;

      if (state.backpack.blocked || hasActiveAbility(state, 'web') || backpackOccupiedByOther) {
        return addLog(state, '📜 МОЛИТВА: Рюкзак занят или заблокирован.', 'info');
      }

      const copiedSpell: Card = {
        id: `prayer_copy_${createId(rng, 7)}`,
        type: 'spell',
        value: 0,
        spellType: targetCard.spellType,
        icon: targetCard.icon,
        name: targetCard.name,
        description: targetCard.description,
      };

      const newState: GameState = { ...state };
      newState.backpack = { ...newState.backpack, card: copiedSpell };

      // Молитва уходит в discard.
      if (prayerLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
      else if (prayerLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
      // prayerLoc === 'backpack': уже “заменили” молитву на копию

      newState.discardPile = [...newState.discardPile, prayerCard];
      newState.hasActed = true;

      return addLog(newState, `📜 МОЛИТВА: Скопировано ${targetCard.icon} в рюкзак.`, 'spell');
    }

    case 'MERCHANT_LEAVE': {
      if (!state.merchant.isActive) return state;
      const newState = closeMerchantAndDeal3({ ...state, hasActed: true }, state.enemySlots);
      return addLog(newState, 'ТОРГОВЕЦ: ты уходишь.', 'info');
    }

    case 'TAKE_CARD_TO_HAND': {
      nextState = { ...state, hasActed: true }; // Фиксируем: игрок совершил действие (блок выбора проклятия)
      if (action.hand === 'backpack' && hasActiveAbility(state, 'web')) {
          logMessage = 'ПАУТИНА: Рюкзак заблокирован!';
          break;
      }

      const { newState, card } = removeCardFromSource(state, action.cardId);
      
      if (!card) return state;

      const targetHand = action.hand === 'left' ? newState.leftHand : 
                        (action.hand === 'right' ? newState.rightHand : newState.backpack);
      
      if (targetHand.card || targetHand.blocked) return state;

      let blocked = false;
      let playerUpdates = {};

      if (action.hand !== 'backpack' && newState.activeEffects.includes('echo')) {
          newState.activeEffects = newState.activeEffects.filter(e => e !== 'echo');

          if (!newState.backpack.card && !newState.backpack.blocked && !hasActiveAbility(state, 'web')) { 
              const copy = { ...card, id: card.id + '_echo_' + createId(rng, 5) };
              newState.backpack = { ...newState.backpack, card: copy };
              logMessage = 'ЭХО: Предмет дублирован в рюкзак. ';
          } else {
              logMessage = 'ЭХО: Магия рассеялась (рюкзак занят). ';
          }
      }

      if (card.type === 'coin') {
         newState.discardPile = [...newState.discardPile, card];
         blocked = true;

         const offeringMonsters = newState.enemySlots.filter(c => c?.type === 'monster' && c.ability === 'offering');
         const greedBonus = newState.curse === 'greed' ? 2 : 0;
         
         if (offeringMonsters.length > 0) {
             const newSlots = [...newState.enemySlots];
             let anyHealed = false;

             offeringMonsters.forEach(m => {
                 const idx = newSlots.findIndex(c => c?.id === m!.id);
                 if (idx !== -1 && newSlots[idx]) {
                     const monster = newSlots[idx]!;
                     const maxHp = monster.maxHealth || monster.value;
                     const currentHp = monster.value;
                     
                     if (currentHp < maxHp) {
                         const healAmount = Math.min(card.value, maxHp - currentHp);
                         newSlots[idx] = { ...monster, value: currentHp + healAmount };
                         logMessage += ` ПОДНОШЕНИЕ: ${monster.icon} +${healAmount} HP.`;
                         anyHealed = true;
                     } else {
                         logMessage += ` ПОДНОШЕНИЕ: ${monster.icon} сыт.`;
                     }
                 }
             });
             
             if (!anyHealed) logMessage += " ПОДНОШЕНИЕ: Жертва принята.";
             
             newState.enemySlots = newSlots;
             logType = 'combat';
             
             if (greedBonus > 0) {
                 const withGreed = updateStats(
                     {
                         ...newState,
                         player: { ...newState.player, coins: newState.player.coins + greedBonus }
                     },
                     { coinsCollected: newState.stats.coinsCollected + greedBonus }
                 );
                 nextState = withGreed;
                 logMessage += ` ЖАДНОСТЬ: +${greedBonus} 💎.`;
                 logType = 'gain';
             } else {
                 nextState = newState;
             }
         } else {
             const gained = card.value + greedBonus;
             playerUpdates = { coins: newState.player.coins + gained };
             logMessage += `Собрано: +${gained} монет`;
             if (greedBonus > 0) logMessage += ` (ЖАДНОСТЬ: +${greedBonus})`;
             logType = 'gain';
             nextState = updateStats(newState, { coinsCollected: newState.stats.coinsCollected + gained });
         }
      } else if (card.type === 'potion' && action.hand !== 'backpack') {
         newState.discardPile = [...newState.discardPile, card];
         blocked = true;
         const healAmount = card.value;
         
         let rotMod = 0;
         if (hasActiveAbility(newState, 'rot')) rotMod = -2;
         
         let poisonMod = 0;
         if (newState.curse === 'poison') poisonMod = -1;
         
         const effectiveHeal = Math.max(0, healAmount + rotMod + poisonMod);

         const neededHeal = newState.player.maxHp - newState.player.hp;
         const overheal = Math.max(0, effectiveHeal - neededHeal);
         const actualHeal = Math.min(effectiveHeal, neededHeal);
         
         const newHp = newState.player.hp + actualHeal;
         nextState = setPlayerHp(newState, newHp, 'potion');
         
         logMessage += `Выпито зелье: +${actualHeal} HP`;
         if (rotMod < 0) logMessage += ' (ГНИЛЬ: -2)';
         if (poisonMod < 0) logMessage += ' (ОТРАВЛЕНИЕ: -1)';
         
         nextState = updateStats(nextState, { hpHealed: newState.stats.hpHealed + actualHeal });

         if (overheal > 0) {
             if (newState.activeEffects.includes('snack')) {
                 const coinsFromSnack = overheal;
                 playerUpdates = { ...playerUpdates, coins: (playerUpdates as any).coins ? (playerUpdates as any).coins + coinsFromSnack : newState.player.coins + coinsFromSnack };
                 newState.activeEffects = newState.activeEffects.filter(e => e !== 'snack');
                 logMessage += ` (Закуска: +${coinsFromSnack} 💎 из Overheal)`;
                 nextState = updateStats(nextState, { coinsCollected: newState.stats.coinsCollected + coinsFromSnack });
             } else {
                 logMessage += ` (Overheal: ${overheal})`;
                 nextState = updateOverheads(nextState, 'overheal', overheal);
             }
        }
        logType = 'heal';
     } else if (card.type === 'skull') {
         if (action.hand === 'backpack') {
              logMessage += `В рюкзак положено: ${card.icon}`;
              nextState = newState;
         } else {
              blocked = true;
              logMessage += `Взято в руку: ${card.icon} (бесполезно)`;
              nextState = newState;
         }
     } else {
        if (action.hand === 'backpack') logMessage += `В рюкзак положено: ${card.icon}`;
        else logMessage += `Взято в руку: ${card.icon}`;
        nextState = newState;
     }

      const updatedHand = { card: card, blocked };
      const slotName = action.hand === 'left' ? 'leftHand' : (action.hand === 'right' ? 'rightHand' : 'backpack');

      nextState = {
        ...nextState,
        player: { ...nextState.player, ...playerUpdates },
        [slotName]: updatedHand
      };
      break;
    }

    case 'INTERACT_WITH_MONSTER': {
        nextState = { ...state, hasActed: true };
        const monsterIdx = findCardInSlots(state.enemySlots, action.monsterId);
        if (monsterIdx === -1) return state;
        const monster = state.enemySlots[monsterIdx];
        if (!monster) return state;

        // Проверка “Тумана”: со скрытой картой нельзя взаимодействовать
        if (monster.isHidden) {
            logMessage = 'ТУМАН: Карта скрыта!';
            break;
        }

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
                const newSlots = [...nextState.enemySlots];
                newSlots[monsterIdx] = null;
                nextState.enemySlots = newSlots;
                
                nextState = updateStats(nextState, { monstersKilled: nextState.stats.monstersKilled + 1 });
                
                nextState = applyKillAbilities(nextState, monster, 'other');

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
                 
                 nextState = updateStats(nextState, { monstersKilled: nextState.stats.monstersKilled + 1 });
                 
                 nextState = applyKillAbilities(nextState, monster, 'other');

                 nextState.discardPile = [...nextState.discardPile, monster];

                 if (res.log) {
                     logMessage = res.log;
                     logType = res.logType || 'combat';
                 }
            } else if (hand.card?.type === 'weapon' || hand.card?.type === 'claymore') {
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
      nextState = { ...state, hasActed: true }; // Фиксируем: игрок совершил действие (блок выбора проклятия)
      const { spellCardId, targetId } = action;
        
        // Проверяем, не скрыта ли цель (Туман)
        const targetLocPre = findCardLocation(state, targetId);
        if (targetLocPre === 'enemySlots') {
             const idx = state.enemySlots.findIndex(c => c?.id === targetId);
             if (idx !== -1) {
                 const targetMonster = state.enemySlots[idx];
                 if (targetMonster && targetMonster.isHidden) {
                     logMessage = 'ТУМАН: Карта скрыта!';
                     break;
                 }
             }
        }

        // Проверка “Молчание”: магия заблокирована
        if (hasActiveAbility(state, 'silence')) {
            logMessage = 'МОЛЧАНИЕ: Магия заблокирована!';
            break;
        }

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
        else if (targetLoc === 'backpack') targetCard = state.backpack.card;
        
        let newState = { ...state };
        let spellUsed = false;
        
        logType = 'spell';

        switch (spellCard.spellType as SpellType) {
            case 'escape': 
                if (targetId === 'player') {
                    const cardsToReturn = newState.enemySlots.filter(c => c !== null) as any[];
                    const newEnemySlots = [null, null, null, null];
                    const newDeck = shuffleDeck([...newState.deck, ...cardsToReturn], rng);
                    
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
                    newState = setPlayerHp(newState, newHp, 'leech');
                    
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
                    if (targetCard.type === 'monster' && targetCard.maxHealth) {
                        cardToReturn = { ...targetCard, value: targetCard.maxHealth };
                    }

                    const newDeck = shuffleDeck([...newState.deck, cardToReturn], rng);
                    
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
                    let dmg = 13 - newState.player.hp;
                    
                    if (newState.activeEffects.includes('miss')) {
                         dmg = Math.max(0, dmg - 2);
                         newState.activeEffects = newState.activeEffects.filter(e => e !== 'miss');
                    }

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

            case 'split':
                if (targetCard?.type === 'monster') {
                    const idx = newState.enemySlots.findIndex(c => c?.id === targetId);
                    const hp = Math.floor(targetCard.value / 2);
                    if (hp >= 1) {
                        const m1 = { ...targetCard, value: hp, id: targetCard.id + '_1' };
                        const m2 = { ...targetCard, value: hp, id: targetCard.id + '_2' };
                        
                        const newSlots = [...newState.enemySlots];
                        newSlots[idx] = m1;
                        
                        const emptyIdx = newSlots.findIndex(c => c === null);
                        if (emptyIdx !== -1) {
                            newSlots[emptyIdx] = m2;
                            logMessage = 'РАСЩЕПЛЕНИЕ: монстр разделен на двоих.';
                        } else {
                            logMessage = 'РАСЩЕПЛЕНИЕ: монстр разделен, но для второго не нашлось места.';
                        }
                        newState.enemySlots = newSlots;
                    } else {
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
                    else if (targetLoc === 'backpack') newState.backpack = { ...newState.backpack, card: newCard };

                    logMessage = `СКУПЩИК: предмет теперь стоит в 2 раза дороже при продаже.`;
                    spellUsed = true;
                }
                break;

            case 'volley':
                if (targetId === 'player') { 
                    const ns = [...newState.enemySlots];
                    let damage = 1;
                    
                    if (newState.activeEffects.includes('miss')) {
                         damage = 0;
                         newState.activeEffects = newState.activeEffects.filter(e => e !== 'miss');
                         logMessage = 'ПРОМАХ: Залп прошел мимо.';
                    }
                    
                    if (damage > 0) {
                        let hits = 0;
                        ns.forEach((c, i) => {
                            if (c && c.type === 'monster') {
                                const newVal = c.value - damage;
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
                        logMessage = `ЗАЛП: нанесено по ${damage} урона ${hits} монстрам.`;
                    }
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
                    const monsters = newState.enemySlots
                        .map((c, i) => ({c, i}))
                        .filter(x => x.c && x.c.type === 'monster') as {c: Card, i: number}[];

                    if (monsters.length >= 2) {
                        const shuffledMonsters = shuffle(monsters, rng);
                        const m1 = shuffledMonsters[0];
                        const m2 = shuffledMonsters[1];

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
                    else if (targetLoc === 'backpack') newState.backpack = { ...newState.backpack, card: newCard };
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
                        if (valid.length > 0 && !newState.backpack.card && !newState.backpack.blocked && !hasActiveAbility(state, 'web')) {
                            const randomCard = valid[pickIndex(rng, valid.length)];
                            newState.backpack = { ...newState.backpack, card: randomCard };
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
                        const topCards = newState.deck.slice(-count).reverse();
                        
                        newState.scoutCards = topCards;

                        const top = newState.deck[newState.deck.length - 1]; 
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
                    let dmg = 4;
                    const selfDmg = 2;

                    if (newState.activeEffects.includes('miss')) {
                         dmg = Math.max(0, dmg - 2);
                         newState.activeEffects = newState.activeEffects.filter(e => e !== 'miss');
                    }
                    
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

                    const dmgToTake = newState.isGodMode ? 0 : selfDmg;
                    newState = setPlayerHp(newState, Math.max(0, newState.player.hp - dmgToTake), 'cut');
                    newState = updateStats(newState, { damageTaken: newState.stats.damageTaken + selfDmg }); 

                    logMessage = `ПОРЕЗ: 4 урона монстру, -2 HP герою.${newState.isGodMode ? ' (GOD)' : ''}`;
                    spellUsed = true;
                }
                break;
        }

        if (spellUsed) {
            newState.discardPile = [...newState.discardPile, spellCard];
            
            if (spellLoc === 'leftHand') newState.leftHand = { ...newState.leftHand, card: null };
            else if (spellLoc === 'rightHand') newState.rightHand = { ...newState.rightHand, card: null };
            else if (spellLoc === 'backpack') newState.backpack = { ...newState.backpack, card: null };
            nextState = newState;
        } else {
            return state;
        }
        break;
    }
    
    case 'RESET_HAND': {
        nextState = { ...state, hasActed: true };
        const cost = state.isGodMode ? 0 : 5;
        const cardsOnTable = state.enemySlots.filter(c => c !== null).length;
        
        if (!state.isGodMode && (state.player.hp <= 5 || cardsOnTable < 4)) return state;

        const newHp = state.player.hp - cost;
        const cardsToReturn = state.enemySlots.filter(c => c !== null) as any[];
        const newDeck = shuffleDeck([...state.deck, ...cardsToReturn], rng);
        const emptySlots = [null, null, null, null];

        nextState = {
            ...state,
            player: state.player,
            enemySlots: emptySlots,
            deck: newDeck
        };
        nextState = setPlayerHp(nextState, newHp, 'reset');
        nextState = updateStats(nextState, { resetsUsed: nextState.stats.resetsUsed + 1 });
        logMessage = `СБРОС: карты убраны, потрачено ${cost} HP.${state.isGodMode ? ' (GOD)' : ''}`;
        break;
    }
    
    case 'SELL_ITEM': {
        // Traveling Merchant: во время магазина продажа разрешена только из рюкзака и строго один раз.
        if (state.merchant.isActive) {
          if (state.merchant.saleUsed) {
            return state;
          }
          if (!state.backpack.card || state.backpack.card.id !== action.cardId) {
            return state;
          }
          if (state.backpack.blocked) {
            return state;
          }
        }

        nextState = { ...state, hasActed: true };
        if (hasActiveAbility(state, 'scream')) {
            logMessage = 'КРИК: Продажа заблокирована монстром!';
            break;
        }

        let cardToSell: Card | null = null;
        if (state.leftHand.card?.id === action.cardId) cardToSell = state.leftHand.card;
        else if (state.rightHand.card?.id === action.cardId) cardToSell = state.rightHand.card;
        else if (state.backpack.card?.id === action.cardId) cardToSell = state.backpack.card;
        else {
             const idx = state.enemySlots.findIndex(c => c?.id === action.cardId);
             if (idx !== -1) cardToSell = state.enemySlots[idx];
        }

        if (cardToSell && cardToSell.type === 'monster') {
             logMessage = 'Нельзя продать монстра!';
             break;
        }
        if (cardToSell && cardToSell.type === 'prayer_spell') {
             logMessage = 'Нельзя продать Молитву!';
             break;
        }

        const { newState, card, fromWhere } = removeCardFromSource(state, action.cardId);
        
        if (!card) return state;

        newState.discardPile = [...newState.discardPile, card];

        let coinsToAdd = 0;
        if (card.type === 'weapon' || card.type === 'potion' || card.type === 'shield' || card.type === 'claymore') {
            coinsToAdd = card.value;
        } else if (card.type === 'coin' || card.type === 'skull') {
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

        if (state.merchant.isActive) {
          nextState = {
            ...nextState,
            merchant: {
              ...nextState.merchant,
              saleUsed: true,
            },
          };
        }
        nextState = updateStats(nextState, { 
            itemsSold: nextState.stats.itemsSold + 1,
            coinsCollected: nextState.stats.coinsCollected + coinsToAdd 
        });
        if (card.type === 'skull') {
            logMessage = `Выброшено: ${card.icon}`;
        } else if (card.type === 'spell') {
            logMessage = `Сброшено: ${card.icon}`;
        } else if (card.type === 'coin') {
            logMessage = `Спасибо: ${card.icon}`;
        } else {
            logMessage = `Продано: ${card.icon} за ${coinsToAdd} монет.`;
        }
        logType = 'gain';
        break;
    }

    case 'CHECK_ROUND_END':
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
      nextState = updateStats(nextState, { endTime: clock.now() });
      nextState = addLog(nextState, "Герой погиб...", 'combat');
  }

  if (logMessage) {
      nextState = addLog(nextState, logMessage, logType);
  }
  
  return updateMirrorMonsters(stateWithRoundCheck(nextState));
  };
};

