import { create } from 'zustand';
import type { Card, Template, HeroStats } from '../types';
import { generateDeck } from '../engine/deck';

export type SlotId = 'table-0' | 'table-1' | 'table-2' | 'table-3' | 'inv-left' | 'inv-backpack' | 'inv-right' | 'shop';

interface GameState {
  isGameActive: boolean;
  hero: HeroStats & { currentHp: number };
  
  deck: Card[];
  discard: Card[];
  
  table: (Card | null)[]; // 4 slots
  inventory: {
    left: Card | null;
    backpack: Card | null;
    right: Card | null;
  };

  _dispatch: (event: GameEvent) => void;
  // Actions
  startGame: (template: Template) => void;
  dealCards: () => void;
  
  // Interactions
  moveCardToInventory: (tableIndex: number, slot: 'left' | 'backpack' | 'right') => void;
  useItemOnMonster: (invSlot: 'left' | 'backpack' | 'right', tableIndex: number) => void;
  sellCard: (tableIndex: number) => void;
  useSkill: (skillId: string, targetTableIndex?: number, targetInventorySlot?: 'left' | 'backpack' | 'right') => void;
  fleeDungeon: () => void;
}

import type { GameEvent } from '../engine/perks';
import { processPerks } from '../engine/perks';
import { playSound } from '../lib/audio';

export const useGameStore = create<GameState>((set, get) => ({
  isGameActive: false,
  hero: { hp: 10, maxHp: 10, gold: 0, skills: [], currentHp: 10 },
  deck: [],
  discard: [],
  table: [null, null, null, null],
  inventory: { left: null, backpack: null, right: null },

  // Helper to dispatch perk events
  _dispatch: (event: GameEvent) => {
      const state = get();
      
      processPerks({
          event,
          state: {
              hero: state.hero,
              table: state.table,
              inventory: state.inventory,
              discard: state.discard,
              deck: state.deck,
          },
          actions: {
              modifyHeroHp: (amount: number) => set(s => ({ hero: { ...s.hero, currentHp: Math.min(s.hero.maxHp, s.hero.currentHp + amount) } })),
              modifyHeroGold: (amount: number) => set(s => ({ hero: { ...s.hero, gold: Math.max(0, s.hero.gold + amount) } })),
              damageMonster: (idx: number, amount: number) => set(s => {
                  const card = s.table[idx];
                  if (!card || card.type !== 'monster') return {};
                  const newHp = card.value - amount; // Damage reduces value
                  const newTable = [...s.table];
                  newTable[idx] = { ...card, value: newHp };
                  return { table: newTable };
              }),
              discardItem: (slot: 'left' | 'backpack' | 'right') => set(s => {
                  const card = s.inventory[slot];
                  if (!card) return {};
                  return {
                      inventory: { ...s.inventory, [slot]: null },
                      discard: [...s.discard, card]
                  };
              }),
              addCardToDeck: (card: Card) => set(s => ({ deck: [...s.deck, card] })),
              spawnMonsterFromDiscard: () => set(s => {
                   const monsters = s.discard.filter(c => c.type === 'monster');
                   if (monsters.length === 0) return {};
                   const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
                   // Remove from discard
                   const newDiscard = s.discard.filter(c => c.id !== randomMonster.id);
                   // Find empty slot
                   const emptyIdx = s.table.findIndex(c => c === null);
                   if (emptyIdx === -1) return {}; // No space
                   
                   const newTable = [...s.table];
                   newTable[emptyIdx] = randomMonster;
                   return { discard: newDiscard, table: newTable };
              })
          }
      });
  },

  startGame: (template) => {
    // Starting game...
    const deck = generateDeck(template);
    set({
        isGameActive: true,
        hero: { 
            ...template.hero, 
            hp: template.hero.maxHp, 
            currentHp: template.hero.maxHp, 
            skills: template.skills,
            gold: template.hero.startGold 
        },
        deck,
        discard: [],
        table: [null, null, null, null],
        inventory: { left: null, backpack: null, right: null },
    });
    get().dealCards();
  },

  dealCards: () => {
      const { _dispatch } = get();
      console.log("Dealing Cards", _dispatch);
      set((state) => {
        // Fill empty table slots from deck
        const newTable = [...state.table];
        const newDeck = [...state.deck];
        let cardsSpawned: Card[] = [];
        
        for (let i = 0; i < 4; i++) {
            if (newTable[i] === null && newDeck.length > 0) {
                const card = newDeck.shift()!;
                newTable[i] = card;
                if (card.type === 'monster') cardsSpawned.push(card);
            }
        }
        return { table: newTable, deck: newDeck };
      });

      // Post-update logic (moved to inside set or separate effect if needed)
      // For now, logic is simplified to avoid sync issues
  },

  moveCardToInventory: (tableIndex, slot) => set((state) => {
      const card = state.table[tableIndex];
      if (!card) return {};

      if (state.inventory[slot] !== null) return {};

      const newTable = [...state.table];
      newTable[tableIndex] = null;

      return {
          table: newTable,
          inventory: { ...state.inventory, [slot]: card }
      };
  }),

  useItemOnMonster: (invSlot, tableIndex) => set((state) => {
      const item = state.inventory[invSlot];
      const target = state.table[tableIndex];

      if (!item || !target) return {};

      const newInventory = { ...state.inventory };
      const newTable = [...state.table];
      const newDiscard = [...state.discard];
      let newHero = { ...state.hero };

      if (target.type === 'monster' && item.type === 'weapon') {
          const damage = item.value;
          const hp = target.value;

          if (damage >= hp) {
              playSound('kill');
              newTable[tableIndex] = null; 
              const remainingDurability = damage - hp;
              if (remainingDurability > 0) {
                  newInventory[invSlot] = { ...item, value: remainingDurability };
              } else {
                  newInventory[invSlot] = null;
                  newDiscard.push(item);
              }
              
              set({ table: newTable, inventory: newInventory, discard: newDiscard });
          } else {
              playSound('hit');
              const remainingHp = hp - damage;
              newTable[tableIndex] = { ...target, value: remainingHp };
              newInventory[invSlot] = null;
              newDiscard.push(item);
          }
      } else if (item.type === 'potion') {
          playSound('heal');
          newHero.currentHp = Math.min(newHero.maxHp, newHero.currentHp + item.value);
          newInventory[invSlot] = null;
          newDiscard.push(item);
      }

      return {
          hero: newHero,
          table: newTable,
          inventory: newInventory,
          discard: newDiscard
      };
  }),

  sellCard: (tableIndex) => set((state) => {
      const card = state.table[tableIndex];
      if (!card) return {};

      playSound('coin');
      const newTable = [...state.table];
      newTable[tableIndex] = null;

      return {
          table: newTable,
          hero: { ...state.hero, gold: state.hero.gold + card.value }
      };
  }),

  useSkill: (skillId, targetIdx, _targetSlot) => set((state) => {
      const newTable = [...state.table];
      let newHero = { ...state.hero };

      if (skillId === 'volley') {
          for (let i = 0; i < 4; i++) {
              const card = newTable[i];
              if (card && card.type === 'monster') {
                  const newHp = card.value - 1;
                  if (newHp <= 0) {
                      newTable[i] = null;
                  } else {
                      newTable[i] = { ...card, value: newHp };
                  }
              }
          }
      }
      else if (skillId === 'split' && typeof targetIdx === 'number') {
           const monster = newTable[targetIdx];
           if (monster && monster.type === 'monster') {
               const halfHp = Math.floor(monster.value / 2);
               if (halfHp > 0) {
                   newTable[targetIdx] = { ...monster, value: halfHp };
                   const emptyIdx = newTable.findIndex(c => c === null);
                   if (emptyIdx !== -1) {
                       newTable[emptyIdx] = { ...monster, id: crypto.randomUUID(), value: halfHp };
                   }
               }
           }
      }
      else if (skillId === 'cut' && typeof targetIdx === 'number') {
           const monster = newTable[targetIdx];
           if (monster && monster.type === 'monster') {
               newHero.currentHp = Math.max(0, newHero.currentHp - 2);
               const newHp = monster.value - 4;
               if (newHp <= 0) {
                   newTable[targetIdx] = null;
               } else {
                   newTable[targetIdx] = { ...monster, value: newHp };
               }
           }
      }
      
      return { table: newTable, hero: newHero };
  }),

  fleeDungeon: () => set({ isGameActive: false }),
}));
