import { Card, CardType, SpellType } from '../types/game';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Icons mapping
const ICONS = {
  monster: '👾', // Fallback, distinct monsters can have distinct icons later
  coin: '💎',
  potion: '🧪',
  shield: '🛡️',
  weapon: '⚔️',
  spell: '📜'
};

const SPELL_DESCRIPTIONS: Record<SpellType, string> = {
  escape: 'Побег: Вернуть врагов в колоду',
  leech: 'Кровосос: Лечение на HP монстра',
  potionify: 'Зельефикация: Предмет -> Зелье',
  wind: 'Ветер: Сдуть карту в колоду',
  sacrifice: 'Жертва: Урон = 13 - HP'
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];

  // Helper to add cards
  const addCards = (type: CardType, values: number[], icon: string) => {
    values.forEach(val => {
      deck.push({
        id: generateId(),
        type,
        value: val,
        maxHealth: type === 'monster' ? val : undefined,
        icon: icon
      });
    });
  };

  // 1. Monsters (19)
  // 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10
  const monsterValues = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10];
  addCards('monster', monsterValues, '🐺'); // Basic wolf for now, can randomize later

  // 2. Coins (9)
  // 2, 3, 4, 5, 6, 7, 8, 9, 10
  const coinValues = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  addCards('coin', coinValues, ICONS.coin);

  // 3. Potions (9)
  // 2, 3, 4, 5, 6, 7, 8, 9, 10
  const potionValues = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  addCards('potion', potionValues, ICONS.potion);

  // 4. Shields (6)
  // 2, 3, 4, 5, 6, 7
  const shieldValues = [2, 3, 4, 5, 6, 7];
  addCards('shield', shieldValues, ICONS.shield);

  // 5. Weapons (6)
  // 2, 3, 4, 5, 6, 7
  const weaponValues = [2, 3, 4, 5, 6, 7];
  addCards('weapon', weaponValues, ICONS.weapon);

  // 6. Spells (5)
  const spells: SpellType[] = ['escape', 'leech', 'potionify', 'wind', 'sacrifice'];
  spells.forEach(spellType => {
    deck.push({
      id: generateId(),
      type: 'spell',
      value: 0,
      spellType: spellType,
      icon: ICONS.spell,
      name: spellType.toUpperCase(),
      description: SPELL_DESCRIPTIONS[spellType]
    });
  });

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

