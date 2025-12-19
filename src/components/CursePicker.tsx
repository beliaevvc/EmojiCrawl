/**
 * CursePicker — UI-пикер проклятий (выбор одного из доступных).
 *
 * Слой: UI (React).
 *
 * Важно (Блок 4 / Content Layer):
 * - список проклятий для отображения берём из `baseGameContent.curses`,
 * - UI не импортит `src/data/curses.ts` напрямую (контент может собираться в `GameContent` packs).
 *
 * Механика проклятий (что делает fog/full_moon/...) — в domain reducer, здесь только выбор/визуал.
 */
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { baseGameContent } from '@/features/game/application/gameContent';
import type { CurseType } from '@/types/game';

interface CursePickerProps {
    onSelect: (curse: CurseType) => void;
    onClose: () => void;
}

export const CursePicker = ({ onSelect, onClose }: CursePickerProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-lg w-full shadow-2xl relative max-h-[80vh] overflow-y-auto custom-scrollbar"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-stone-200 uppercase tracking-widest mb-1">
                        Проклятья
                    </h2>
                    <p className="text-stone-400 text-xs">Выберите бремя для этого путешествия.</p>
                </div>

                <div className="grid gap-3">
                    {baseGameContent.curses.map((curse) => (
                        <button
                            key={curse.id}
                            onClick={() => onSelect(curse.id)}
                            className="group flex items-start gap-4 p-4 bg-stone-950/50 border border-stone-800 hover:border-rose-900/50 hover:bg-rose-950/10 rounded-xl transition-all text-left"
                        >
                            <div className={`text-4xl ${curse.color} filter drop-shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                {curse.icon}
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${curse.color} group-hover:text-stone-200 transition-colors`}>
                                    {curse.name}
                                </h3>
                                <p className="text-stone-500 text-xs leading-relaxed group-hover:text-stone-400">
                                    {curse.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

