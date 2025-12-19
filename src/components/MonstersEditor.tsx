/**
 * MonstersEditor — редактор групп монстров для кастомного забега (UI).
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - показывает список групп монстров (`MonsterGroupConfig[]`),
 * - позволяет добавлять/удалять/редактировать группы,
 * - позволяет быстро выбрать “усиление” (ability) через `AbilityPicker`.
 *
 * Важно (Блок 4 / Content Layer):
 * - определения способностей (иконки/названия/описания) берём из `baseGameContent.monsterAbilitiesById`,
 * - UI не импортит `src/data/monsterAbilities.ts` напрямую.
 *
 * Механика способностей (когда они срабатывают) — в domain reducer, здесь только редактор/визуал.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, Plus, Minus, PlusCircle, Zap } from 'lucide-react';
import { MonsterGroupConfig } from '../types/game';
import { ConfirmationModal } from './ConfirmationModal';
import MonsterGroupEditor from './MonsterGroupEditor';
import AbilityPicker from './AbilityPicker';
import { DEFAULT_MONSTER_GROUPS } from './MonstersEditor.defaults';
import { baseGameContent } from '@/features/game/application/gameContent';

interface MonstersEditorProps {
    initialGroups: MonsterGroupConfig[];
    onSave: (groups: MonsterGroupConfig[]) => void;
    onClose: () => void;
}

const MonstersEditor = ({ initialGroups, onSave, onClose }: MonstersEditorProps) => {
    const [groups, setGroups] = useState<MonsterGroupConfig[]>(initialGroups.length > 0 ? initialGroups : DEFAULT_MONSTER_GROUPS);
    const [editingGroup, setEditingGroup] = useState<MonsterGroupConfig | null>(null);
    const [newGroupTemp, setNewGroupTemp] = useState<{ value: number, count: number } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null); // Group ID
    const [showAbilityPicker, setShowAbilityPicker] = useState(false);

    const totalMonsters = groups.reduce((acc, g) => acc + g.count, 0) + (newGroupTemp ? newGroupTemp.count : 0);

    const handleCreateNewGroup = () => {
        setNewGroupTemp({ value: 1, count: 1 });
    };

    const confirmNewGroup = () => {
        if (!newGroupTemp) return;
        // Check if group with this value exists? 
        // User didn't specify restriction, but usually we merge or allow distinct.
        // "Группа с 5 атакой". If we add another 5 attack, should it merge?
        // Let's allow distinct for now, as they might have different abilities later.
        const newGroup: MonsterGroupConfig = {
            id: `custom_${Date.now()}`,
            value: newGroupTemp.value,
            count: newGroupTemp.count
        };
        setGroups([...groups, newGroup]);
        setNewGroupTemp(null);
    };

    const updateGroup = (updated: MonsterGroupConfig) => {
        setGroups(groups.map(g => g.id === updated.id ? updated : g));
        setEditingGroup(null);
    };

    const deleteGroup = (id: string) => {
        setGroups(groups.filter(g => g.id !== id));
        setItemToDelete(null);
        setEditingGroup(null);
    };

    const isGroupModified = (group: MonsterGroupConfig) => {
        if (group.id.startsWith('custom')) return true;
        const def = DEFAULT_MONSTER_GROUPS.find(g => g.id === group.id);
        if (!def) return true; 
        return group.count !== def.count || group.ability !== def.ability;
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-950 border border-stone-700 rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-stone-200 uppercase tracking-widest">Монстры</h2>
                            <p className="text-stone-500 text-xs mt-1">Настройка групп монстров</p>
                        </div>
                        
                        <div className="h-8 w-px bg-stone-800"></div>
                        <div className="flex flex-col justify-center">
                             <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest leading-none mb-1">Всего</span>
                             <span className="text-xl font-mono font-bold text-stone-300 leading-none">{totalMonsters}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowAbilityPicker(true)}
                        className="ml-auto mr-4 flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-colors group"
                    >
                        <Zap size={14} className="text-purple-400 group-hover:text-purple-200" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 group-hover:text-purple-100">Усилить всех</span>
                    </button>

                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 pt-10 -mx-2">
                    <div className="flex flex-wrap gap-6 justify-center">
                        
                        {/* Existing Groups */}
                        {groups.sort((a,b) => a.value - b.value).map((group) => {
                            const abilityDef = group.ability ? baseGameContent.monsterAbilitiesById[group.ability] : null;
                            
                            return (
                                <motion.div 
                                    key={group.id}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setEditingGroup(group)}
                                    className="flex flex-col items-center gap-2 relative cursor-pointer group"
                                    style={{ margin: '10px' }} 
                                >
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-rose-500/50 bg-rose-900/20 flex items-center justify-center relative overflow-visible shadow-lg">
                                        {/* Main Wolf Icon */}
                                        <span className="text-4xl md:text-5xl select-none z-0 opacity-80">🐺</span>
                                        
                                        {/* Value (Attack) - Center Overlay or Bottom Badge? */}
                                        {/* User wants Wolf visible. Let's put Value in a prominent badge at the bottom center or overlapping */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-stone-900 border-2 border-rose-500 rounded-full w-10 h-10 flex items-center justify-center z-10 shadow-md">
                                            <span className="text-lg font-black text-rose-200">{group.value}</span>
                                        </div>
                                        
                                    {/* Ability Icon Badge - Top Center Overlapping */}
                                    {abilityDef && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-stone-900 border border-stone-600 rounded-full flex items-center justify-center text-sm shadow-md z-20" title={abilityDef.name}>
                                            {abilityDef.icon}
                                        </div>
                                    )}

                                    {/* Label Indicator (Top Left in Editor List) */}
                                    {group.label && (
                                        <div 
                                            className="absolute top-1 left-1 w-4 h-4 rounded-full border border-stone-900 shadow-sm z-10"
                                            title={group.label}
                                            style={{
                                                backgroundColor: 
                                                    group.label === 'ordinary' ? '#10b981' :
                                                    group.label === 'tank' ? '#eab308' :
                                                    group.label === 'medium' ? '#f97316' :
                                                    group.label === 'mini-boss' ? '#a855f7' :
                                                    group.label === 'boss' ? '#e11d48' : 'transparent'
                                            }}
                                        />
                                    )}

                                    {/* New Badge if custom? - Top Center (Above Ability) */}
                                    {isGroupModified(group) && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-rose-400 z-30 pointer-events-none whitespace-nowrap">
                                            NEW
                                        </div>
                                    )}
                                    </div>
                                    
                                    {/* Count Badge - Top Right */}
                                    <div className="absolute top-0 -right-2 w-8 h-8 bg-stone-700 border-2 border-stone-500 rounded-full flex items-center justify-center text-sm font-bold text-stone-200 z-20 shadow-md">
                                        {group.count}
                                    </div>
                                    
                                    {/* Delete Button - Top Left */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setItemToDelete(group.id);
                                        }}
                                        className="absolute -top-1 -left-1 w-7 h-7 bg-stone-800 border border-stone-600 rounded-full flex items-center justify-center text-stone-400 hover:bg-rose-900 hover:text-white hover:border-rose-500 transition-colors z-20 shadow-md opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>

                                    
                                </motion.div>
                            );
                        })}

                        {/* New Group Temp Creator */}
                        {newGroupTemp ? (
                            <div className="flex flex-col items-center gap-2 bg-stone-900/50 p-2 rounded-xl border border-stone-700 animate-pulse-once">
                                <div className="flex items-center gap-2 mb-2">
                                    <button onClick={() => newGroupTemp.value > 1 && setNewGroupTemp({...newGroupTemp, value: newGroupTemp.value - 1})} className="p-1 hover:text-white"><Minus size={16}/></button>
                                    <div className="w-16 h-16 rounded-full border-4 border-dashed border-rose-500/50 flex items-center justify-center text-2xl font-bold text-rose-200">
                                        {newGroupTemp.value}
                                    </div>
                                    <button onClick={() => setNewGroupTemp({...newGroupTemp, value: newGroupTemp.value + 1})} className="p-1 hover:text-white"><Plus size={16}/></button>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => setNewGroupTemp(null)} className="flex-1 bg-stone-800 rounded p-1 text-xs hover:bg-stone-700"><X size={14} className="mx-auto"/></button>
                                    <button onClick={confirmNewGroup} className="flex-1 bg-rose-900/50 text-rose-200 rounded p-1 text-xs hover:bg-rose-800/50"><Check size={14} className="mx-auto"/></button>
                                </div>
                            </div>
                        ) : (
                            /* Add Button */
                            <div className="flex flex-col items-center gap-2">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCreateNewGroup}
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-stone-600 hover:border-rose-500 bg-stone-900/50 hover:bg-rose-900/10 flex flex-col items-center justify-center text-stone-500 hover:text-rose-400 transition-all group"
                                >
                                    <PlusCircle size={32} className="mb-1" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest">Добавить</span>
                                </motion.button>
                                <div className="h-[34px]"></div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 w-full pt-6 border-t border-stone-800 mt-4">
                    <button 
                        onClick={() => setGroups([...DEFAULT_MONSTER_GROUPS])}
                        className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"
                    >
                        <RotateCcw size={16} /> Сбросить
                    </button>
                    <button 
                        onClick={() => onSave(groups)}
                        className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-950 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        <Check size={16} /> Подтвердить
                    </button>
                </div>

                <AnimatePresence>
                    {editingGroup && (
                        <MonsterGroupEditor 
                            group={editingGroup}
                            onSave={updateGroup}
                            onDeleteGroup={() => {
                                setEditingGroup(null);
                                setItemToDelete(editingGroup.id);
                            }}
                            onClose={() => setEditingGroup(null)}
                        />
                    )}
                    {itemToDelete && (
                        <ConfirmationModal 
                            title="Удалить группу?"
                            message="Вы уверены, что хотите удалить эту группу монстров?"
                            onConfirm={() => deleteGroup(itemToDelete)}
                            onCancel={() => setItemToDelete(null)}
                        />
                    )}
                    {showAbilityPicker && (
                        <AbilityPicker 
                            onSelect={(ability) => {
                                setGroups(groups.map(g => ({ ...g, ability })));
                                setShowAbilityPicker(false);
                            }}
                            onClose={() => setShowAbilityPicker(false)}
                        />
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
};

export default MonstersEditor;

