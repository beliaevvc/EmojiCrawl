import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RotateCcw, X, Trash2, PlusCircle } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import SpellPicker from './SpellPicker';
import { SpellType } from '../types/game';
import { SPELLS, BASE_SPELLS } from '../data/spells';

interface SpellsEditorProps {
    initialValues: SpellType[];
    onSave: (values: SpellType[]) => void;
    onClose: () => void;
}

const SpellCardItem = ({ 
    spellId, 
    onDelete, 
    isDeleteMode 
}: { 
    spellId: SpellType; 
    onDelete: () => void; 
    isDeleteMode: boolean;
}) => {
    const spell = SPELLS.find(s => s.id === spellId);
    if (!spell) return null;

    return (
        <div className="flex flex-col items-center gap-2 relative group">
            <motion.div 
                animate={isDeleteMode ? { rotate: [-2, 2, -2], transition: { repeat: Infinity, duration: 0.3 } } : {}}
                className="relative"
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-indigo-500/50 bg-indigo-900/20 flex items-center justify-center text-2xl md:text-3xl shadow-lg relative overflow-hidden backdrop-blur-sm">
                    <span className="z-10">{spell.icon}</span>
                    
                    {isDeleteMode && (
                        <button 
                            onClick={onDelete}
                            className="absolute inset-0 bg-rose-900/80 z-30 flex items-center justify-center cursor-pointer hover:bg-rose-800/90 transition-colors"
                        >
                            <X size={32} className="text-rose-200" />
                        </button>
                    )}
                </div>
            </motion.div>
            
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide max-w-[80px] text-center leading-tight">
                {spell.name}
            </span>
        </div>
    );
};

const SpellsEditor = ({ initialValues, onSave, onClose }: SpellsEditorProps) => {
    const [spells, setSpells] = useState<SpellType[]>([...initialValues]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null); // Index to delete
    const [showPicker, setShowPicker] = useState(false);

    const handleAdd = (spellId: SpellType) => {
        setSpells([...spells, spellId]);
        setShowPicker(false);
    };

    const handleDeleteClick = (index: number) => {
        setItemToDelete(index);
    };

    const confirmDelete = () => {
        if (itemToDelete !== null) {
            setSpells(spells.filter((_, i) => i !== itemToDelete));
            setItemToDelete(null);
            if (spells.length <= 1) setIsDeleteMode(false); 
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
                className="bg-stone-950 border border-stone-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-stone-200 uppercase tracking-widest">Заклинания</h2>
                            <p className="text-stone-500 text-xs mt-1">Настройка колоды заклинаний</p>
                        </div>
                        
                        {/* Counter Badge */}
                        <div className="h-8 w-px bg-stone-800"></div>
                        <div className="flex flex-col justify-center">
                             <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest leading-none mb-1">Всего</span>
                             <span className="text-xl font-mono font-bold text-stone-300 leading-none">{spells.length}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsDeleteMode(!isDeleteMode)}
                            className={`p-2 rounded-lg transition-colors border ${isDeleteMode ? 'bg-rose-900/30 border-rose-500 text-rose-400' : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'}`}
                            title="Режим удаления"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-stone-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 -mx-2">
                    <div className="flex flex-wrap gap-6 justify-center">
                        {spells.map((spellId, index) => (
                            <SpellCardItem 
                                key={`${spellId}-${index}`} 
                                spellId={spellId}
                                onDelete={() => handleDeleteClick(index)}
                                isDeleteMode={isDeleteMode}
                            />
                        ))}

                        {/* Add Button */}
                        {!isDeleteMode && (
                            <div className="flex flex-col items-center gap-2">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowPicker(true)}
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-stone-600 hover:border-indigo-500 bg-stone-900/50 hover:bg-indigo-900/10 flex flex-col items-center justify-center text-stone-500 hover:text-indigo-400 transition-all group"
                                >
                                    <PlusCircle size={28} className="mb-1" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest">Добавить</span>
                                </motion.button>
                                {/* Spacer for text alignment */}
                                <div className="h-[14px]"></div>
                            </div>
                        )}
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

