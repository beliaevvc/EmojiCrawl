import { Card, CardType, SpellType } from '../types/game';
import { SPELLS } from '../data/spells';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Icons mapping
const ICONS = {
  monster: '🐺', // Default icon
  coin: '💎',
  potion: '🧪',
  shield: '🛡️',
  weapon: '⚔️',
  spell: '📜'
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
  const monsterValues = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10];
  addCards('monster', monsterValues, ICONS.monster);

  // 2. Coins (9)
  const coinValues = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  addCards('coin', coinValues, ICONS.coin);

  // 3. Potions (9)
  const potionValues = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  addCards('potion', potionValues, ICONS.potion);

  // 4. Shields (6)
  const shieldValues = [2, 3, 4, 5, 6, 7];
  addCards('shield', shieldValues, ICONS.shield);

  // 5. Weapons (6)
  const weaponValues = [2, 3, 4, 5, 6, 7];
  addCards('weapon', weaponValues, ICONS.weapon);

  // 6. Spells (5)
  const baseSpells: SpellType[] = ['escape', 'leech', 'potionify', 'wind', 'sacrifice'];
  
  baseSpells.forEach(spellType => {
    const spellDef = SPELLS.find(s => s.id === spellType);
    if (spellDef) {
        deck.push({
          id: generateId(),
          type: 'spell',
          value: 0,
          spellType: spellType,
          icon: spellDef.icon,
          name: spellDef.name,
          description: spellDef.description
        });
    }
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
