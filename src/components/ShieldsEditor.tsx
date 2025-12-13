import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Check, RotateCcw, X, PlusCircle } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface ShieldsEditorProps {
    initialValues: number[];
    onSave: (values: number[]) => void;
    onClose: () => void;
}

const DEFAULT_SHIELDS = [2, 3, 4, 5, 6, 7];

const ShieldCardItem = ({ 
    value, 
    onChange, 
    onDelete 
}: { 
    value: number; 
    onChange: (val: number) => void; 
    onDelete: () => void; 
}) => (
    <div className="flex flex-col items-center gap-2 relative group" style={{ margin: '10px' }}>
        <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-stone-400 bg-stone-800 flex items-center justify-center text-3xl md:text-4xl shadow-lg relative overflow-visible">
                <span className="z-10 select-none">🛡️</span>
                
                {/* Value Badge - Bottom Center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-stone-900 border-2 border-stone-500 rounded-full w-10 h-10 flex items-center justify-center z-10 shadow-md">
                    <span className="text-lg font-black text-stone-200">{value}</span>
                </div>
            </div>
            
            {/* Delete Button - Top Left (Hover) */}
            <button 
                onClick={onDelete}
                className="absolute -top-1 -left-1 w-7 h-7 bg-stone-800 border border-stone-600 rounded-full flex items-center justify-center text-stone-400 hover:bg-rose-900 hover:text-white hover:border-rose-500 transition-colors z-20 shadow-md opacity-0 group-hover:opacity-100"
            >
                <X size={14} />
            </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 bg-stone-900/50 p-1 rounded-lg border border-stone-800 mt-4">
            <button 
                onClick={() => value > 1 && onChange(value - 1)}
                disabled={value <= 1}
                className="w-6 h-6 flex items-center justify-center rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 disabled:opacity-30"
            >
                <Minus size={12} />
            </button>
            <button 
                onClick={() => value < 20 && onChange(value + 1)}
                disabled={value >= 20}
                className="w-6 h-6 flex items-center justify-center rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 disabled:opacity-30"
            >
                <Plus size={12} />
            </button>
        </div>
    </div>
);

const ShieldsEditor = ({ initialValues, onSave, onClose }: ShieldsEditorProps) => {
    const [shields, setShields] = useState<number[]>([...initialValues]);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null); // Index to delete

    const handleChange = (index: number, newValue: number) => {
        const newShields = [...shields];
        newShields[index] = newValue;
        setShields(newShields);
    };

    const handleAdd = () => {
        setShields([...shields, 1]);
    };

    const handleDeleteClick = (index: number) => {
        setItemToDelete(index);
    };

    const confirmDelete = () => {
        if (itemToDelete !== null) {
            setShields(shields.filter((_, i) => i !== itemToDelete));
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
                            <h2 className="text-2xl font-display font-bold text-stone-200 uppercase tracking-widest">Щиты</h2>
                            <p className="text-stone-500 text-xs mt-1">Настройка колоды щитов</p>
                        </div>
                        
                        <div className="h-8 w-px bg-stone-800"></div>
                        <div className="flex flex-col justify-center">
                             <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest leading-none mb-1">Всего</span>
                             <span className="text-xl font-mono font-bold text-stone-300 leading-none">{shields.length}</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 -mx-2">
                    <div className="flex flex-wrap gap-6 justify-center">
                        {shields.map((val, index) => (
                            <ShieldCardItem 
                                key={index} 
                                value={val} 
                                onChange={(v) => handleChange(index, v)}
                                onDelete={() => handleDeleteClick(index)}
                            />
                        ))}

                        {/* Add Button */}
                        <div className="flex flex-col items-center gap-2">
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAdd}
                                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-stone-600 hover:border-emerald-500 bg-stone-900/50 hover:bg-emerald-900/10 flex flex-col items-center justify-center text-stone-500 hover:text-emerald-400 transition-all group"
                            >
                                <PlusCircle size={32} className="mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Добавить</span>
                            </motion.button>
                            {/* Spacer to align with controls height */}
                            <div className="h-[34px] mt-4"></div>
                        </div>

                    </div>
                    {shields.length === 0 && (
                        <div className="text-center text-stone-600 py-10">Нет щитов в колоде</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 w-full pt-6 border-t border-stone-800 mt-4">
                    <button 
                        onClick={() => setShields([...DEFAULT_SHIELDS])}
                        className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"
                    >
                        <RotateCcw size={16} /> Сбросить
                    </button>
                    <button 
                        onClick={() => onSave(shields)}
                        className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-950 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        <Check size={16} /> Подтвердить
                    </button>
                </div>

                <AnimatePresence>
                    {itemToDelete !== null && (
                        <ConfirmationModal 
                            title="Удалить карту?"
                            message="Вы уверены, что хотите удалить этот щит из колоды?"
                            onConfirm={confirmDelete}
                            onCancel={() => setItemToDelete(null)}
                        />
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
};

export default ShieldsEditor;
