import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Plus } from 'lucide-react';
import { SPELLS } from '../data/spells';
import { SpellType } from '../types/game';

interface SpellPickerProps {
    onSelect: (spellId: SpellType) => void;
    onClose: () => void;
}

const SpellPicker = ({ onSelect, onClose }: SpellPickerProps) => {
    const [search, setSearch] = useState('');

    const filteredSpells = SPELLS.filter(spell => 
        spell.name.toLowerCase().includes(search.toLowerCase()) || 
        spell.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-stone-800 flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Поиск заклинания..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl py-2 pl-10 pr-4 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-indigo-500 transition-colors"
                            autoFocus
                        />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-lg transition-colors">
                        <X size={20} className="text-stone-400" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {filteredSpells.map(spell => (
                        <div 
                            key={spell.id}
                            className="flex items-center gap-4 p-3 bg-stone-950/50 border border-stone-800 rounded-xl hover:border-indigo-500/50 transition-colors group cursor-pointer"
                            onClick={() => onSelect(spell.id)}
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-900/20 border border-indigo-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {spell.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-stone-200 text-sm group-hover:text-indigo-300 transition-colors">{spell.name}</h4>
                                <p className="text-stone-500 text-xs leading-snug">{spell.description}</p>
                            </div>
                            <button className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                    {filteredSpells.length === 0 && (
                        <div className="text-center text-stone-600 py-10">Ничего не найдено</div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SpellPicker;

