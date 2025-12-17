import { motion } from 'framer-motion';
import { X, BarChart3, Layers, Trash2, Activity, ScrollText, Tag, LayoutDashboard } from 'lucide-react';
import { HUDVisibility, saveUIVisibility } from '../utils/uiStorage';

interface HUDSettingsModalProps {
    visibility: HUDVisibility;
    onUpdate: (newVisibility: HUDVisibility) => void;
    onClose: () => void;
}

const SETTINGS = [
    { id: 'deckStats', label: 'Статистика колоды', icon: BarChart3, desc: 'Показывает количество карт по типам' },
    { id: 'deckViewer', label: 'Просмотр колоды', icon: Layers, desc: 'Окно просмотра оставшихся карт' },
    { id: 'discardViewer', label: 'Просмотр сброса', icon: Trash2, desc: 'Окно просмотра сыгранных карт' },
    { id: 'statsWindow', label: 'Аналитика', icon: Activity, desc: 'Overheal, Overkill, Overdef' },
    { id: 'logWindow', label: 'Журнал событий', icon: ScrollText, desc: 'История действий и эффектов' },
    { id: 'labelsWindow', label: 'Классы монстров', icon: Tag, desc: 'Справочник меток (Танк, Босс...)' },
] as const;

export const HUDSettingsModal = ({ visibility, onUpdate, onClose }: HUDSettingsModalProps) => {
    const handleToggle = (id: keyof HUDVisibility) => {
        const newVisibility = { ...visibility, [id]: !visibility[id] };
        onUpdate(newVisibility);
        saveUIVisibility(newVisibility);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 10, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shadow-inner">
                             <LayoutDashboard className="text-stone-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-bold text-stone-200 uppercase tracking-widest leading-none">Интерфейс</h3>
                            <p className="text-[10px] text-stone-500 font-mono mt-1 uppercase tracking-wider">Настройка видимости HUD</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Settings List */}
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar -mr-2 pb-2">
                    {SETTINGS.map((item) => {
                        const isActive = visibility[item.id];
                        const Icon = item.icon;
                        
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleToggle(item.id)}
                                className={`
                                    flex items-center justify-between p-3 pl-4 
                                    bg-stone-950/50 border rounded-xl 
                                    cursor-pointer transition-all duration-200 group
                                    ${isActive 
                                        ? 'border-stone-700 hover:border-emerald-500/30' 
                                        : 'border-stone-800/50 hover:border-stone-700 opacity-70 hover:opacity-100'}
                                `}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                        ${isActive ? 'bg-emerald-900/20 text-emerald-500' : 'bg-stone-900 text-stone-600'}
                                    `}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <h4 className={`
                                            font-bold text-sm uppercase tracking-wide transition-colors
                                            ${isActive ? 'text-stone-200 group-hover:text-emerald-400' : 'text-stone-500 group-hover:text-stone-400'}
                                        `}>
                                            {item.label}
                                        </h4>
                                        <p className="text-[10px] text-stone-600 font-mono leading-none mt-1">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Custom Toggle Switch */}
                                <div className={`
                                    w-11 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ml-4
                                    ${isActive 
                                        ? 'bg-emerald-900/40 ring-1 ring-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                        : 'bg-stone-800 ring-1 ring-stone-700'}
                                `}>
                                    <div className={`
                                        absolute top-1 bottom-1 w-4 rounded-full transition-all duration-300 shadow-sm
                                        ${isActive 
                                            ? 'left-6 bg-emerald-400' 
                                            : 'left-1 bg-stone-600'}
                                    `} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-stone-800 flex justify-between items-center text-[10px] text-stone-600 font-mono uppercase tracking-widest">
                    <span>Skazmor UI v2.0</span>
                    <span>System Config</span>
                </div>
            </motion.div>
        </motion.div>
    );
};
