import type { Template, Card, Category } from '../types';
import { CATEGORY_META } from '../lib/constants';

export function generateDeck(template: Template): Card[] {
    let deck: Card[] = [];

    // Helper to add cards
    const add = (type: Category, items: { value: number; count: number }[]) => {
        items.forEach(item => {
            for (let i = 0; i < item.count; i++) {
                deck.push({
                    id: crypto.randomUUID(),
                    type,
                    value: item.value,
                    emoji: CATEGORY_META[type].emoji,
                    name: `${CATEGORY_META[type].label} ${item.value}`,
                });
            }
        });
    };

    // Add simple items
    add('weapon', template.deck.weapons);
    add('shield', template.deck.shields);
    add('potion', template.deck.potions);
    add('coin', template.deck.coins);

    // Add monsters
    template.deck.monsters.forEach(config => {
        for (let i = 0; i < config.count; i++) {
            deck.push({
                id: crypto.randomUUID(),
                type: 'monster',
                value: config.hp,
                emoji: CATEGORY_META.monster.emoji,
                name: config.isBoss ? 'BOSS' : 'Monster',
                meta: {
                    maxHp: config.hp,
                    perks: config.perks,
                    isBoss: config.isBoss,
                }
            });
        }
    });

    return shuffle(deck);
}

function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

