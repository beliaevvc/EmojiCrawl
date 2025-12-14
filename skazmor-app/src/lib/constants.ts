import type { Category } from '../types';

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
    weapon: { label: 'WEAPONS', emoji: '⚔️', color: 'bg-slate-800' },
    shield: { label: 'SHIELDS', emoji: '🛡️', color: 'bg-slate-700' },
    potion: { label: 'POTIONS', emoji: '🧪', color: 'bg-rose-950' },
    coin: { label: 'CRYSTALS', emoji: '💎', color: 'bg-amber-950' },
    monster: { label: 'MONSTERS', emoji: '👹', color: 'bg-emerald-950' },
};

