import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template, MonsterConfig } from '../types';
import type { Category } from '../types';

interface EditorState {
  templates: Template[];
  currentTemplateId: string | null;
  activeCategory: Category | null;
  
  // Actions
  createTemplate: (name: string) => void;
  selectTemplate: (id: string) => void;
  updateTemplateHero: (maxHp: number, gold: number) => void;
  
  // Coin Actions
  addCard: (category: Category, value: number) => void;
  removeCardByValue: (category: Category, value: number) => void;
  
  // Monster Specific
  addMonsterCategory: (hp: number) => void;
  updateMonsterPerks: (configId: string, perkIds: string[]) => void;
  updateMonsterConfig: (configId: string, updates: Partial<MonsterConfig>) => void;
  updateTemplateSkills: (skills: string[]) => void;
}

const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Default Run',
  hero: { maxHp: 10, startGold: 0 },
  deck: {
    weapons: [
        { value: 1, count: 2 },
        { value: 2, count: 1 }
    ],
    shields: [
        { value: 2, count: 3 },
        { value: 4, count: 1 }
    ],
    potions: [
        { value: 2, count: 2 }
    ],
    coins: [
        { value: 1, count: 4 },
        { value: 3, count: 1 }
    ],
    monsters: [
        { id: 'm1', hp: 3, perks: [], isBoss: false, count: 3 },
        { id: 'm2', hp: 5, perks: [], isBoss: false, count: 2 },
        { id: 'm3', hp: 10, perks: ['boss_strike'], isBoss: true, count: 1 }
    ],
  },
  skills: [],
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, _get) => ({
      templates: [DEFAULT_TEMPLATE],
      currentTemplateId: null,
      activeCategory: null,

      createTemplate: (name) => set((state) => {
        const newTemplate: Template = {
            ...DEFAULT_TEMPLATE,
            id: crypto.randomUUID(),
            name,
        };
        return { templates: [...state.templates, newTemplate], currentTemplateId: newTemplate.id };
      }),

      selectTemplate: (id) => set({ currentTemplateId: id }),

      updateTemplateHero: (maxHp, gold) => set((state) => {
          const t = state.templates.find(t => t.id === state.currentTemplateId);
          if (!t) return {};
          // Update logic would go here, immutable update of templates array
          const updated = { ...t, hero: { maxHp, startGold: gold } };
          return { templates: state.templates.map(tx => tx.id === t.id ? updated : tx) };
      }),

      addCard: (category, value) => set((state) => {
        const template = state.templates.find(t => t.id === state.currentTemplateId);
        if (!template) return {};

        const key = (category + 's') as keyof typeof template.deck;
        if (key === 'monsters') return {}; // Handle monsters separately

        // @ts-ignore - we know this is the array of { value, count }
        const items = [...template.deck[key]];
        const existingItem = items.find((i: any) => i.value === value);

        if (existingItem) {
          existingItem.count++;
        } else {
          items.push({ value, count: 1 });
        }

        const updatedDeck = { ...template.deck, [key]: items };
        const updatedTemplate = { ...template, deck: updatedDeck };

        return {
          templates: state.templates.map(t => t.id === template.id ? updatedTemplate : t)
        };
      }),

      removeCard: (_category: Category, _valueIndex: any) => set((_state) => {
         // This is tricky with index if we use compressed state. 
         // We'll change the signature to removeCard(category, value)
         // But wait, if we have duplicate values, removing one is fine.
         // Let's assume the UI passes the specific value to decrement.
         return {};
      }),
      
      // New helper to remove by value
      removeCardByValue: (category: Category, value: number) => set((state) => {
        const template = state.templates.find(t => t.id === state.currentTemplateId);
        if (!template) return {};
        
        const key = (category + 's') as keyof typeof template.deck;
        if (key === 'monsters') return {};

        // @ts-ignore
        const items = [...template.deck[key]];
        const existingItemIndex = items.findIndex((i: any) => i.value === value);

        if (existingItemIndex !== -1) {
            if (items[existingItemIndex].count > 1) {
                items[existingItemIndex].count--;
            } else {
                items.splice(existingItemIndex, 1);
            }
        }

        const updatedDeck = { ...template.deck, [key]: items };
        const updatedTemplate = { ...template, deck: updatedDeck };

        return {
          templates: state.templates.map(t => t.id === template.id ? updatedTemplate : t)
        };
      }),
      addMonsterCategory: (hp) => set((state) => {
        const template = state.templates.find(t => t.id === state.currentTemplateId);
        if (!template) return {};
        
        const newConfig: MonsterConfig = {
            id: crypto.randomUUID(),
            hp,
            perks: [],
            isBoss: false,
            count: 1
        };

        const updatedDeck = { 
            ...template.deck, 
            monsters: [...template.deck.monsters, newConfig] 
        };
        
        return {
             templates: state.templates.map(t => t.id === template.id ? { ...t, deck: updatedDeck } : t)
        };
      }),

      updateMonsterPerks: (configId, perkIds) => set((state) => {
        const template = state.templates.find(t => t.id === state.currentTemplateId);
        if (!template) return {};

        const updatedMonsters = template.deck.monsters.map(m => 
            m.id === configId ? { ...m, perks: perkIds } : m
        );

        return {
            templates: state.templates.map(t => t.id === template.id ? { ...t, deck: { ...template.deck, monsters: updatedMonsters } } : t)
        };
      }),

      // Helper to change count or HP
      updateMonsterConfig: (configId, updates) => set((state) => {
        const template = state.templates.find(t => t.id === state.currentTemplateId);
        if (!template) return {};

        const updatedMonsters = template.deck.monsters.map(m => 
            m.id === configId ? { ...m, ...updates } : m
        ).filter(m => m.count > 0); // Auto-remove if count 0

        return {
            templates: state.templates.map(t => t.id === template.id ? { ...t, deck: { ...template.deck, monsters: updatedMonsters } } : t)
        };
      }),

      updateTemplateSkills: (skills) => set((state) => {
          const template = state.templates.find(t => t.id === state.currentTemplateId);
          if (!template) return {};
          return {
              templates: state.templates.map(t => t.id === template.id ? { ...t, skills } : t)
          };
      }),
    }),
    {
      name: 'skazmor-editor-storage',
    }
  )
);

