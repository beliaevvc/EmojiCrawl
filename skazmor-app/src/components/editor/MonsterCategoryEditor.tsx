import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '../../stores/useEditorStore';
import { EditorLayout } from '../layout/EditorLayout';
import { Coin } from '../game/Coin';
import { PERKS } from '../../data/perks';

interface MonsterCategoryEditorProps {
    onBack: () => void;
}

export function MonsterCategoryEditor({ onBack }: MonsterCategoryEditorProps) {
    const { currentTemplateId, templates, addMonsterCategory, updateMonsterConfig, updateMonsterPerks } = useEditorStore();
    const template = templates.find(t => t.id === currentTemplateId);
    const [editingPerksId, setEditingPerksId] = useState<string | null>(null);

    if (!template) return null;

    const monsters = template.deck.monsters;

    const handleAddMonster = (configId: string, currentCount: number) => {
        updateMonsterConfig(configId, { count: currentCount + 1 });
    };

    const handleRemoveMonster = (configId: string, currentCount: number) => {
        updateMonsterConfig(configId, { count: currentCount - 1 });
    };

    const handleCreateGroup = () => {
        addMonsterCategory(1); // Start with 1 HP
    };

    const togglePerk = (configId: string, perkId: string, currentPerks: string[]) => {
        if (currentPerks.includes(perkId)) {
            updateMonsterPerks(configId, currentPerks.filter(p => p !== perkId));
        } else {
            updateMonsterPerks(configId, [...currentPerks, perkId]);
        }
    };

    return (
        <EditorLayout title="EDITING: MONSTERS" onBack={onBack}>
            <div className="space-y-8 pb-20">
                {monsters.map(config => (
                    <motion.div 
                        key={config.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative group"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-bold uppercase text-sm">Health:</span>
                                    <div className="flex items-center">
                                        <button 
                                            onClick={() => updateMonsterConfig(config.id, { hp: Math.max(1, config.hp - 1) })}
                                            className="w-8 h-8 bg-slate-800 rounded-l hover:bg-slate-700 text-slate-300 font-bold"
                                        >-</button>
                                        <span className="w-12 text-center bg-slate-950 font-mono py-1 text-rose-500 font-bold">{config.hp}</span>
                                        <button 
                                            onClick={() => updateMonsterConfig(config.id, { hp: config.hp + 1 })}
                                            className="w-8 h-8 bg-slate-800 rounded-r hover:bg-slate-700 text-slate-300 font-bold"
                                        >+</button>
                                    </div>
                                </div>

                                <div className="h-8 w-px bg-slate-800 mx-2" />

                                <div className="flex flex-wrap gap-2">
                                    {config.perks.length === 0 && (
                                        <span className="text-slate-600 text-sm italic">No Perks</span>
                                    )}
                                    {config.perks.map(pid => (
                                        <span key={pid} className="bg-indigo-900/50 text-indigo-200 text-xs px-2 py-1 rounded border border-indigo-500/30">
                                            {PERKS.find(p => p.id === pid)?.name}
                                        </span>
                                    ))}
                                    <button 
                                        onClick={() => setEditingPerksId(config.id)}
                                        className="bg-slate-800 hover:bg-slate-700 text-xs px-2 py-1 rounded border border-slate-700 transition-colors"
                                    >
                                        EDIT PERKS ⚡
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleRemoveMonster(config.id, 1)} // Sets to 0 -> removes group
                                className="text-rose-900 hover:text-rose-500 text-sm"
                            >
                                DELETE GROUP
                            </button>
                        </div>

                        {/* Monster Grid */}
                        <div className="flex flex-wrap gap-4">
                            {Array(config.count).fill(0).map((_, idx) => (
                                <motion.div key={idx} layout>
                                    <div className="relative group/coin">
                                        <Coin 
                                            type="monster"
                                            value={config.hp}
                                            emoji="👹"
                                            size="sm"
                                        />
                                        <button 
                                            onClick={() => handleRemoveMonster(config.id, config.count)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full text-xs opacity-0 group-hover/coin:opacity-100 transition-opacity"
                                        >
                                            -
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            <button 
                                onClick={() => handleAddMonster(config.id, config.count)}
                                className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center hover:border-slate-600 hover:bg-slate-800/30 transition-all text-slate-600"
                            >
                                +
                            </button>
                        </div>
                    </motion.div>
                ))}

                <button 
                    onClick={handleCreateGroup}
                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest"
                >
                    <span>➕ Create New Monster Group</span>
                </button>
            </div>

            {/* Perk Selector Modal */}
            <AnimatePresence>
                {editingPerksId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold">SELECT PERKS</h3>
                                <button onClick={() => setEditingPerksId(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PERKS.map(perk => {
                                    const isActive = monsters.find(m => m.id === editingPerksId)?.perks.includes(perk.id);
                                    return (
                                        <button
                                            key={perk.id}
                                            onClick={() => editingPerksId && togglePerk(editingPerksId, perk.id, monsters.find(m => m.id === editingPerksId)!.perks)}
                                            className={`text-left p-4 rounded-xl border transition-all ${
                                                isActive 
                                                ? 'bg-indigo-950 border-indigo-500 ring-1 ring-indigo-500' 
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="font-bold mb-1 flex justify-between">
                                                {perk.name}
                                                {isActive && <span>✓</span>}
                                            </div>
                                            <p className="text-xs text-slate-400">{perk.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </EditorLayout>
    );
}


