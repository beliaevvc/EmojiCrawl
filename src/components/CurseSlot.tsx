import { CurseType } from '../types/game';
import { CURSES } from '../data/curses';
import { motion } from 'framer-motion';

interface CurseSlotProps {
    curse: CurseType | null;
    isLocked: boolean;
    onClick: () => void;
}

export const CurseSlot = ({ curse, isLocked, onClick }: CurseSlotProps) => {
    const curseDef = curse ? CURSES.find(c => c.id === curse) : null;

    if (curseDef) {
        return (
            <div className="group relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-2xl md:text-4xl shadow-lg cursor-help transition-all hover:scale-110 hover:border-stone-400 z-10">
                <span className="filter drop-shadow-lg">{curseDef.icon}</span>
                
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-stone-900 border border-stone-600 p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <div className="text-center">
                        <div className={`font-bold text-xs uppercase tracking-wider mb-1 ${curseDef.color}`}>
                            {curseDef.name}
                        </div>
                        <div className="text-[10px] text-stone-400 leading-tight">
                            {curseDef.description}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLocked) {
        // Empty locked slot (no curse selected, and can't select anymore)
        return (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-dashed border-stone-800 bg-stone-950/50 flex items-center justify-center opacity-30 cursor-default" title="Проклятие не выбрано">
                <span className="text-stone-700 text-lg">✕</span>
            </div>
        );
    }

    // Available to pick
    return (
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-dashed border-stone-600 hover:border-stone-400 bg-stone-900/30 hover:bg-stone-800/50 flex items-center justify-center cursor-pointer group transition-colors"
            title="Добавить проклятие"
        >
            <span className="text-stone-500 group-hover:text-stone-300 text-2xl font-bold transition-colors">+</span>
        </motion.button>
    );
};

