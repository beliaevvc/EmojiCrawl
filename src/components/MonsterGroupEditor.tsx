/**
 * MonsterGroupEditor — модалка редактирования одной группы монстров (UI).
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - правит count/ability/label для конкретной группы,
 * - использует `AbilityPicker` для выбора способности.
 *
 * Важно (Блок 4 / Content Layer):
 * - текущую выбранную способность (иконка/название/описание) берём из `baseGameContent.monsterAbilitiesById`,
 * - UI не импортит `src/data/monsterAbilities.ts`.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Minus, Zap } from 'lucide-react';
import { MonsterGroupConfig, MonsterAbilityType, MonsterLabelType } from '../types/game';
import AbilityPicker from './AbilityPicker';
import { baseGameContent } from '@/features/game/application/gameContent';

interface MonsterGroupEditorProps {
    group: MonsterGroupConfig;
    onSave: (updatedGroup: MonsterGroupConfig) => void;
    onClose: () => void;
    onDeleteGroup: () => void; // Only for custom groups (created by user) with attack 1? Or generally? 
    // User said: "Adding a category creates one with Attack 1 and 1 Token".
    // "We can choose any category and get into level 2 editing - adding/removing coins (but not attack)".
    // So delete logic might be: if count reaches 0 -> delete group? Or explicit delete button?
    // Let's assume explicit delete in Level 1 or here if count 0.
    // User said: "Can add/remove coins".
}

const MonsterGroupEditor = ({ group, onSave, onClose, onDeleteGroup }: MonsterGroupEditorProps) => {
    const [count, setCount] = useState(group.count);
    const [ability, setAbility] = useState<MonsterAbilityType | undefined>(group.ability);
    const [label, setLabel] = useState<MonsterLabelType | undefined>(group.label);
    const [showAbilityPicker, setShowAbilityPicker] = useState(false);

    const activeAbility = ability ? baseGameContent.monsterAbilitiesById[ability] : null;

    const handleSave = () => {
        onSave({ ...group, count, ability, label });
    };

    const LABELS: { id: MonsterLabelType, color: string, name: string }[] = [
        { id: 'ordinary', color: '#10b981', name: 'Обычный' }, // emerald-500
        { id: 'tank', color: '#eab308', name: 'Танк' },      // yellow-500
        { id: 'medium', color: '#f97316', name: 'Средний' },  // orange-500
        { id: 'mini-boss', color: '#a855f7', name: 'Мини босс' }, // purple-500
        { id: 'boss', color: '#e11d48', name: 'Босс' },       // rose-600
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-950 border border-stone-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-stone-200 uppercase tracking-widest flex items-center gap-3">
                            Монстры <span className="text-rose-500 text-3xl">{group.value}</span>
                        </h2>
                        <p className="text-stone-500 text-xs mt-1">Редактирование группы</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-8">
                    
                    {/* Count Control */}
                    <div className="flex items-center justify-between bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-sm">Количество</span>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => count > 0 && setCount(count - 1)}
                                className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-rose-400 hover:bg-stone-700 transition-colors"
                            >
                                <Minus size={20} />
                            </button>
                            <span className="text-2xl font-mono font-bold text-stone-200 w-8 text-center">{count}</span>
                            <div className="relative">
                                {/* Label Preview on Card Icon */}
                                {label && (
                                     <div 
                                        className="absolute -top-3 -left-3 w-4 h-4 rounded-full border border-stone-900 shadow-sm z-10"
                                        style={{ backgroundColor: LABELS.find(l => l.id === label)?.color }}
                                     />
                                )}
                            </div>
                            <button  
                                onClick={() => setCount(count + 1)}
                                className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-emerald-400 hover:bg-stone-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Ability Control */}
                    <div className="flex flex-col gap-3">
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-sm">Способность группы</span>
                        
                        {activeAbility ? (
                            <div className="flex items-center justify-between bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl group relative overflow-hidden">
                                <div className="flex items-center gap-4 z-10">
                                    <div className="text-3xl">{activeAbility.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-rose-200">{activeAbility.name}</h4>
                                        <p className="text-stone-400 text-xs">{activeAbility.description}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAbility(undefined)}
                                    className="p-2 bg-stone-900/50 rounded-lg text-stone-500 hover:text-rose-400 transition-colors z-10"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowAbilityPicker(true)}
                                className="w-full py-4 border-2 border-dashed border-stone-700 hover:border-rose-500/50 rounded-xl flex items-center justify-center gap-2 text-stone-500 hover:text-rose-300 hover:bg-rose-900/10 transition-all group"
                            >
                                <Zap size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold uppercase tracking-widest text-xs">Усилить категорию</span>
                            </button>
                        )}
                    </div>

                    {/* Label Control */}
                    <div className="flex flex-col gap-3">
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-sm">Назначить метку</span>
                        <div className="flex items-center gap-3 bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                             {LABELS.map((l) => (
                                 <button
                                    key={l.id}
                                    onClick={() => setLabel(label === l.id ? undefined : l.id)}
                                    className={`
                                        w-8 h-8 rounded-full border-2 transition-all relative group
                                        ${label === l.id ? 'scale-110 shadow-lg shadow-black ring-2 ring-white/50 border-transparent' : 'border-stone-700 hover:scale-105 hover:border-stone-500'}
                                    `}
                                    style={{ backgroundColor: l.color }}
                                    title={l.name}
                                 >
                                     {label === l.id && (
                                         <motion.div 
                                            initial={{ scale: 0 }} 
                                            animate={{ scale: 1 }}
                                            className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md"
                                         >
                                             <Check size={14} strokeWidth={4} />
                                         </motion.div>
                                     )}
                                 </button>
                             ))}
                             
                             {/* Label Preview */}
                             {label && (
                                 <div className="ml-auto text-xs font-bold uppercase tracking-widest" style={{ color: LABELS.find(l => l.id === label)?.color }}>
                                     {LABELS.find(l => l.id === label)?.name}
                                 </div>
                             )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="mt-8 flex gap-4">
                    {group.count === 0 || count === 0 ? (
                         <button 
                            onClick={onDeleteGroup}
                            className="flex-1 py-3 px-4 rounded-xl border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"
                        >
                            Удалить
                        </button>
                    ) : (
                        <div className="flex-1"></div>
                    )}
                   
                    <button 
                        onClick={handleSave}
                        className="flex-[2] py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-950 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        <Check size={16} /> Подтвердить
                    </button>
                </div>

                <AnimatePresence>
                    {showAbilityPicker && (
                        <AbilityPicker 
                            onSelect={(id) => {
                                setAbility(id);
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

export default MonsterGroupEditor;

