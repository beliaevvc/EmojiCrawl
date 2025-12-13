import { motion } from 'framer-motion';
import { Plus, Minus, Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

interface CharacterStats {
    hp: number;
    maxHp: number;
    coins: number;
}

interface CharacterEditorProps {
    initialStats: CharacterStats;
    onSave: (stats: CharacterStats) => void;
    onClose: () => void;
}

const DEFAULT_STATS: CharacterStats = {
    hp: 13,
    maxHp: 13,
    coins: 0
};

const StatControl = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 99,
    color
}: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
    min?: number; 
    max?: number;
    color: string;
}) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-4 bg-stone-900/50 p-2 rounded-xl border border-stone-800">
            <button 
                onClick={() => value > min && onChange(value - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={value <= min}
            >
                <Minus size={16} />
            </button>
            
            <span className={`text-2xl font-mono font-bold w-12 text-center ${color}`}>{value}</span>
            
            <button 
                onClick={() => value < max && onChange(value + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={value >= max}
            >
                <Plus size={16} />
            </button>
        </div>
    </div>
);

const CharacterEditor = ({ initialStats, onSave, onClose }: CharacterEditorProps) => {
    const [stats, setStats] = useState<CharacterStats>(initialStats);

    const handleHpChange = (newHp: number) => {
        setStats(prev => ({ ...prev, hp: newHp, maxHp: newHp }));
    };

    const handleCoinsChange = (newCoins: number) => {
        setStats(prev => ({ ...prev, coins: newCoins }));
    };

    const handleReset = () => {
        setStats(DEFAULT_STATS);
    };

    const handleSave = () => {
        onSave(stats);
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
                className="bg-stone-950 border border-stone-700 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative flex flex-col items-center gap-8"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-stone-200 uppercase tracking-widest">Персонаж</h2>
                    <p className="text-stone-500 text-xs mt-1">Настройка стартовых характеристик</p>
                </div>

                {/* Visual Representation (Preview) */}
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                    <div className="w-full h-full rounded-full border-4 border-stone-400 bg-stone-800 flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative z-10">
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rose-900/50 to-transparent h-full"></div>
                        <span className="relative z-10">🧙‍♂️</span>
                    </div>

                    {/* Indicators */}
                     <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 min-w-[2.5rem] h-10 px-2 bg-green-900 border-2 border-green-500 rounded-full flex items-center justify-center text-lg font-bold text-green-100 z-20 shadow-md">
                        {stats.hp}
                     </div>
                     <div className="absolute top-1/2 -right-4 -translate-y-1/2 min-w-[2rem] h-8 px-1.5 bg-stone-700 border border-stone-500 rounded-full flex items-center justify-center text-xs font-bold text-stone-300 z-20 shadow-md">
                        {stats.coins}
                     </div>
                </div>

                {/* Controls */}
                <div className="flex gap-8 md:gap-12 w-full justify-center">
                    <StatControl 
                        label="Здоровье (HP)" 
                        value={stats.hp} 
                        onChange={handleHpChange}
                        min={1}
                        max={30}
                        color="text-emerald-400"
                    />
                    <StatControl 
                        label="Монеты" 
                        value={stats.coins} 
                        onChange={handleCoinsChange}
                        min={0}
                        max={99}
                        color="text-amber-400"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-4 w-full pt-4">
                    <button 
                        onClick={handleReset}
                        className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"
                    >
                        <RotateCcw size={16} /> Сбросить
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-950 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        <Check size={16} /> Подтвердить
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
};

export default CharacterEditor;

