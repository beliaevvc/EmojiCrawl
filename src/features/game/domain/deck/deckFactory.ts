// Доменная логика: создание и перемешивание колоды (Domain).
//
// Что делает этот файл:
// - создаёт “стандартную” колоду для обычного забега,
// - перемешивает колоду.
//
// Важно:
// - это domain код: тут нет React/UI/Supabase/LocalStorage,
// - при этом колода содержит “карточки”, у которых есть и визуальные поля (icon/name/description).
//
// Блок 4 (Content Layer):
// - domain не должен импортить `src/data/*` и `src/content/*`,
// - но чтобы заполнить spell-карты корректными icon/name/description,
//   application слой передаёт минимальный snapshot `content` через `START_GAME.content`.
//
// Правило:
// - если `content` не передан (или неполный), используем безопасные fallback’и
//   (иконка 📜, имя “Заклинание”, пустое описание), чтобы не ломать ранние сценарии.

import type { SpellMeta } from '../model/types';
import { Card, CardType, SpellType } from '../model/types';
import type { Rng } from '../ports/Rng';

// Вспомогательное: генерация id
// Важно: это не “IdGenerator port” (его можно добавить позже), но уже убираем прямой `Math.random()`.
const generateId = (rng: Rng, length = 9) => {
  // `toString(36)` может дать строку короче нужной длины, поэтому добираем в цикле.
  let s = '';
  while (s.length < length) {
    s += rng.nextFloat().toString(36).slice(2);
  }
  return s.slice(0, length);
};

// Маппинг “тип карты -> иконка” (дефолты для базовой колоды)
const ICONS = {
  monster: '🐺', // Дефолтная иконка (конкретные монстры могут переопределять)
  coin: '💎',
  potion: '🧪',
  shield: '🛡️',
  weapon: '⚔️',
  spell: '📜'
};

export const createDeck = (
  content: {
  baseSpellIds?: SpellType[];
  spellsById?: Record<string, SpellMeta>;
  } | undefined,
  rng: Rng
): Card[] => {
  const deck: Card[] = [];

  // Хелпер: добавить пачку однотипных карт с заданными значениями
  const addCards = (type: CardType, values: number[], icon: string) => {
    values.forEach(val => {
      deck.push({
        id: generateId(rng),
        type,
        value: val,
        maxHealth: type === 'monster' ? val : undefined,
        icon: icon
      });
    });
  };

  // 1) Монстры (19)
  const monsterValues = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10];
  addCards('monster', monsterValues, ICONS.monster);

  // 2) Монеты (9)
  const coinValues = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  addCards('coin', coinValues, ICONS.coin);

  // 3) Зелья (9)
  const potionValues = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  addCards('potion', potionValues, ICONS.potion);

  // 4) Щиты (6)
  const shieldValues = [2, 3, 4, 5, 6, 7];
  addCards('shield', shieldValues, ICONS.shield);

  // 5) Оружие (6)
  const weaponValues = [2, 3, 4, 5, 6, 7];
  addCards('weapon', weaponValues, ICONS.weapon);

  // 6) Базовые заклинания (5)
  const baseSpells: SpellType[] =
    content?.baseSpellIds && content.baseSpellIds.length > 0
      ? content.baseSpellIds
      : ['escape', 'leech', 'potionify', 'wind', 'sacrifice'];
  
  baseSpells.forEach(spellType => {
    // `meta` приходит из application слоя (GameContent snapshot).
    // Domain не знает “откуда” это — ему важно только заполнить карточку корректными данными.
    const meta = content?.spellsById?.[spellType];
        deck.push({
          id: generateId(rng),
          type: 'spell',
          value: 0,
          spellType: spellType,
      icon: meta?.icon ?? ICONS.spell,
      name: meta?.name ?? 'Заклинание',
      description: meta?.description ?? '',
        });
  });

  return shuffleDeck(deck, rng);
};

export const shuffleDeck = (deck: Card[], rng: Rng): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextFloat() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

