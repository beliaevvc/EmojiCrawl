import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Check, RotateCcw, X } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import SpellPicker from './SpellPicker';
import { SpellType } from '../types/game';
import { BASE_SPELLS, SPELLS } from '../data/spells';

interface SpellsEditorProps {
    initialValues: SpellType[];
    onSave: (values: SpellType[]) => void;
    onClose: () => void;
}

const SpellCardItem = ({ 
    spellId, 
    onDelete 
}: { 
    spellId: SpellType; 
    onDelete: () => void; 
}) => {
    const spell = SPELLS.find(s => s.id === spellId);
    if (!spell) return null;

    return (
        <div className="flex flex-col items-center gap-2 relative group" style={{ margin: '10px' }}>
            <div className="relative">
                <div 
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-indigo-500/50 bg-indigo-900/20 flex items-center justify-center text-3xl md:text-4xl shadow-lg relative cursor-help"
                    title={`${spell.name}: ${spell.description}`}
                >
                    <span className="z-10 select-none">{spell.icon}</span>
                </div>
                
                {/* Delete Button - Top Left (Hover) */}
                <button 
                    onClick={onDelete}
                    className="absolute -top-1 -left-1 w-7 h-7 bg-stone-800 border border-stone-600 rounded-full flex items-center justify-center text-stone-400 hover:bg-rose-900 hover:text-white hover:border-rose-500 transition-colors z-20 shadow-md opacity-0 group-hover:opacity-100"
                >
                    <X size={14} />
                </button>
            </div>
             <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest max-w-[80px] text-center truncate">{spell.name}</span>
        </div>
    );
};

const SpellsEditor = ({ initialValues, onSave, onClose }: SpellsEditorProps) => {
    const [spells, setSpells] = useState<SpellType[]>([...initialValues]);
    const [showPicker, setShowPicker] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const handleAdd = (newSpell: SpellType) => {
        setSpells([...spells, newSpell]);
        setShowPicker(false);
    };

    const handleDeleteClick = (index: number) => {
        setItemToDelete(index);
    };

    const confirmDelete = () => {
        if (itemToDelete !== null) {
            setSpells(spells.filter((_, i) => i !== itemToDelete));
            setItemToDelete(null);
        }
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
                            <h2 className="text-2xl font-display font-bold text-stone-200 uppercase tracking-widest">Заклинания</h2>
                            <p className="text-stone-500 text-xs mt-1">Настройка колоды заклинаний</p>
                        </div>
                        
                        <div className="h-8 w-px bg-stone-800"></div>
                        <div className="flex flex-col justify-center">
                             <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest leading-none mb-1">Всего</span>
                             <span className="text-xl font-mono font-bold text-stone-300 leading-none">{spells.length}</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 -mx-2">
                    <div className="flex flex-wrap gap-6 justify-center">
                        {spells.map((spell, index) => (
                            <SpellCardItem 
                                key={index} 
                                spellId={spell} 
                                onDelete={() => handleDeleteClick(index)}
                            />
                        ))}

                        {/* Add Button */}
                        <div className="flex flex-col items-center gap-2" style={{ margin: '10px' }}>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowPicker(true)}
                                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-stone-600 hover:border-emerald-500 bg-stone-900/50 hover:bg-emerald-900/10 flex flex-col items-center justify-center text-stone-500 hover:text-emerald-400 transition-all group"
                            >
                                <PlusCircle size={32} className="mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Добавить</span>
                            </motion.button>
                            {/* Text Spacer */}
                            <div className="h-[15px]"></div> 
                        </div>

                    </div>
                    {spells.length === 0 && (
                        <div className="text-center text-stone-600 py-10">Нет заклинаний в колоде</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 w-full pt-6 border-t border-stone-800 mt-4">
                    <button 
                        onClick={() => setSpells([...BASE_SPELLS])}
                        className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"
                    >
                        <RotateCcw size={16} /> Сбросить
                    </button>
                    <button 
                        onClick={() => onSave(spells)}
                        className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-950 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        <Check size={16} /> Подтвердить
                    </button>
                </div>

                <AnimatePresence>
                    {itemToDelete !== null && (
                        <ConfirmationModal 
                            title="Удалить заклинание?"
                            message="Вы уверены, что хотите удалить это заклинание из колоды?"
                            onConfirm={confirmDelete}
                            onCancel={() => setItemToDelete(null)}
                        />
                    )}
                    {showPicker && (
                        <SpellPicker 
                            onSelect={handleAdd}
                            onClose={() => setShowPicker(false)}
                        />
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
};

export default SpellsEditor;
