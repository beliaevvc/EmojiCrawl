import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { WindowPosition } from '../utils/uiStorage';
import { MonsterLabelType } from '../types/game';

interface MonsterLabelsWindowProps {
    position?: WindowPosition;
    onPositionChange?: (pos: WindowPosition) => void;
    activeLabels: MonsterLabelType[];
}

const LABELS_CONFIG: Record<MonsterLabelType, { name: string; color: string }> = {
    'ordinary': { name: 'Обычный', color: 'bg-[#10b981]' },
    'tank': { name: 'Танк', color: 'bg-[#eab308]' },
    'medium': { name: 'Средний', color: 'bg-[#f97316]' },
    'mini-boss': { name: 'Мини-босс', color: 'bg-[#a855f7]' },
    'boss': { name: 'Босс', color: 'bg-[#e11d48]' }
};

export const MonsterLabelsWindow = ({ position, onPositionChange, activeLabels }: MonsterLabelsWindowProps) => {
    const x = position?.x || 0;
    const y = position?.y || 0;

    // Show all labels if any modified monster is present (activeLabels.length > 0)
    if (activeLabels.length === 0) return null;

    const allLabels = Object.entries(LABELS_CONFIG);

    return (
        <motion.div 
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => onPositionChange && onPositionChange({ x: x + info.offset.x, y: y + info.offset.y })}
            initial={{ opacity: 0, x: x + 20, y }}
            animate={{ opacity: 1, x, y }}
            exit={{ opacity: 0, x: x + 20, y }}
            className="absolute top-60 right-4 z-30 bg-stone-900/80 backdrop-blur-md border border-stone-700 rounded-xl p-3 shadow-xl w-48 select-none cursor-move active:cursor-grabbing"
        >
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 border-b border-stone-800 pb-1 flex items-center gap-2">
                <Tag size={12} /> Классы
            </h3>
            <div className="space-y-2">
                {allLabels.map(([key, config]) => {
                    const isActive = activeLabels.includes(key as MonsterLabelType);
                    return (
                        <div key={key} className={`flex items-center gap-2 ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${config.color} shadow-sm ring-1 ring-black/30`} />
                            <span className="text-[10px] md:text-xs font-bold text-stone-300 uppercase tracking-wide">
                                {config.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

