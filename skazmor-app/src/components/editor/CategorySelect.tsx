import React from 'react';
import { EditorLayout } from '../layout/EditorLayout';
import { motion } from 'framer-motion';
import type { Category } from '../../types';
import { useEditorStore } from '../../stores/useEditorStore';
import { CATEGORY_META } from '../../lib/constants';

interface CategorySelectProps {
    onBack: () => void;
    onSelectCategory: (category: Category | 'ability') => void;
    onPlay: () => void;
}

export function CategorySelect({ onBack, onSelectCategory, onPlay }: CategorySelectProps) {
    const { currentTemplateId, templates } = useEditorStore();
    const template = templates.find(t => t.id === currentTemplateId);

    if (!template) return <div>Template not found</div>;

    const totalCards = Object.values(template.deck).reduce((acc, arr: any) => acc + arr.length, 0);

    return (
        <EditorLayout 
            title={`EDITING: ${template.name}`} 
            onBack={onBack}
            actions={
                <button 
                    onClick={onPlay}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-900/50 animate-pulse"
                >
                    PLAY RUN ▶
                </button>
            }
        >
            <div className="flex flex-col gap-8">
                {/* Hero Stats Summary */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-200">HERO</h2>
                        <div className="flex gap-4 mt-2">
                            <span className="text-rose-400 font-bold">❤️ {template.hero.maxHp} HP</span>
                            <span className="text-amber-400 font-bold">💰 {template.hero.startGold} GOLD</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-black text-slate-700">{totalCards as number}</span>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Total Cards</p>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([id, meta]) => (
                        <motion.button
                            key={id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelectCategory(id)}
                            className={`${meta.color} aspect-square rounded-2xl border-2 border-white/5 hover:border-white/20 flex flex-col items-center justify-center gap-4 group transition-all`}
                        >
                            <span className="text-6xl drop-shadow-xl filter sepia-[0.3] group-hover:sepia-0 transition-all">{meta.emoji}</span>
                            <span className="font-bold tracking-widest text-white/80 group-hover:text-white">{meta.label}</span>
                            
                            {/* Count Badge */}
                            <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-mono">
                                {template.deck[(id + 's') as keyof typeof template.deck]?.length || 0}
                            </span>
                        </motion.button>
                    ))}

                    {/* Skill Editor Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCategory('ability')}
                        className="bg-indigo-950 aspect-square rounded-2xl border-2 border-white/5 hover:border-white/20 flex flex-col items-center justify-center gap-4 group transition-all"
                    >
                        <span className="text-6xl drop-shadow-xl filter sepia-[0.3] group-hover:sepia-0 transition-all">⚡</span>
                        <span className="font-bold tracking-widest text-white/80 group-hover:text-white">SKILLS</span>
                        <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-mono">
                            {template.skills.length}
                        </span>
                    </motion.button>
                </div>
            </div>
        </EditorLayout>
    );
}
