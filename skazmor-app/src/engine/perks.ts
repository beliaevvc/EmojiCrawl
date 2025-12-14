import type { Card, HeroStats } from '../types';

export type GameEvent = 
    | { type: 'ON_KILL'; monster: Card; weapon: Card | null }
    | { type: 'ON_SPAWN'; monster: Card }
    | { type: 'ON_TURN_START' }
    | { type: 'ON_TURN_END' }
    | { type: 'ON_DAMAGE_HERO'; amount: number; source: Card | null };

interface PerkContext {
    event: GameEvent;
    state: {
        hero: HeroStats;
        table: (Card | null)[];
        inventory: { left: Card | null; backpack: Card | null; right: Card | null };
        discard: Card[];
        deck: Card[];
    };
    actions: {
        modifyHeroHp: (amount: number) => void;
        modifyHeroGold: (amount: number) => void;
        damageMonster: (tableIndex: number, amount: number) => void;
        discardItem: (slot: 'left' | 'backpack' | 'right') => void;
        addCardToDeck: (card: Card) => void;
        spawnMonsterFromDiscard: () => void;
    };
}

export function processPerks(context: PerkContext) {
    const { event, state, actions } = context;
    const activeMonsters = state.table.filter(c => c?.type === 'monster') as Card[];
    
    // Check passives that affect events
    const passivePerks = activeMonsters.flatMap(m => m.meta?.perks || []);
    
    // --- ON_KILL EVENTS ---
    if (event.type === 'ON_KILL') {
        const perks = event.monster.meta?.perks || [];
        const _killerPerks = passivePerks; // Perks from other alive monsters (e.g. Parasite)
        console.log("Processing Kill", _killerPerks); // Usage to avoid TS error

        // 1. Commission
        if (perks.includes('commission')) actions.modifyHeroGold(-3);
        
        // 4. Breach
        if (perks.includes('breach')) {
             if (state.inventory.left?.type === 'shield') actions.discardItem('left');
             else if (state.inventory.right?.type === 'shield') actions.discardItem('right');
             else if (state.inventory.backpack?.type === 'shield') actions.discardItem('backpack');
        }
        
        // 5. Disarm
        if (perks.includes('disarm')) {
            if (state.inventory.left?.type === 'weapon') actions.discardItem('left');
            else if (state.inventory.right?.type === 'weapon') actions.discardItem('right');
            else if (state.inventory.backpack?.type === 'weapon') actions.discardItem('backpack');
        }
        
        // 6. Blessing
        if (perks.includes('blessing')) actions.modifyHeroHp(2);
        
        // 10. Graveyard
        if (perks.includes('graveyard')) actions.spawnMonsterFromDiscard();
        
        // 12. Legacy
        if (perks.includes('legacy')) {
            state.table.forEach((c, idx) => {
                if (c?.type === 'monster') actions.damageMonster(idx, -1);
            });
        }

        // 17. Theft
        if (perks.includes('theft')) {
             const slots = ['left', 'right', 'backpack'].filter(s => state.inventory[s as keyof typeof state.inventory] !== null) as ('left' | 'backpack' | 'right')[];
             if (slots.length > 0) {
                 const randomSlot = slots[Math.floor(Math.random() * slots.length)];
                 actions.discardItem(randomSlot);
             }
        }

        // 20. Bones
        if (perks.includes('bones')) {
             actions.addCardToDeck({
                 id: crypto.randomUUID(),
                 type: 'coin',
                 value: 0,
                 emoji: '💀',
                 name: 'Dead Coin'
             });
        }
        
        // 23. Corrosion
        if (perks.includes('corrosion')) {
             // -2 Value to random item
             // Need "modifyItemValue" action. Using discard for now as fallback or just log
             console.log("Corrosion triggered (impl needed)");
        }
        
        // 25. Junk
        if (perks.includes('junk')) {
            // Add dead coin to inventory? Assuming add to deck for MVP if inv full logic tricky
            actions.addCardToDeck({ id: crypto.randomUUID(), type: 'coin', value: 0, emoji: '💀', name: 'Dead Coin' });
        }

        // 22. Parasite (Passive on OTHER monsters)
        // "When hero kills other monsters, this gets +1 HP"
        state.table.forEach((c, idx) => {
            if (c?.type === 'monster' && c.id !== event.monster.id && c.meta?.perks?.includes('parasite')) {
                actions.damageMonster(idx, -1);
            }
        });
    }

    // --- ON_SPAWN EVENTS ---
    if (event.type === 'ON_SPAWN') {
        const perks = event.monster.meta?.perks || [];
        
        // 15. Ambush
        if (perks.includes('ambush')) actions.modifyHeroHp(-1);
        
        // 27. Scavenger
        if (perks.includes('scavenger')) {
            const count = state.discard.filter(c => c.type === 'monster').length;
            if (count > 0) {
                 const idx = state.table.findIndex(c => c?.id === event.monster.id);
                 if (idx !== -1) actions.damageMonster(idx, -count); 
            }
        }
    }
}
