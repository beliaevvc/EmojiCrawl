import { motion } from 'framer-motion';
import { X, Settings, Monitor } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

interface SettingsModalProps {
    onClose: () => void;
}

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
    const { isScreensaverEnabled, toggleScreensaver } = useSettingsStore();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Settings className="text-stone-400" size={24} />
                        <h3 className="text-xl font-display font-bold text-stone-200 uppercase tracking-widest">Настройки</h3>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div 
                        className="flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer group"
                        onClick={toggleScreensaver}
                    >
                        <div className="flex items-center gap-3">
                            <Monitor className={`transition-colors ${isScreensaverEnabled ? 'text-emerald-500' : 'text-stone-600'}`} size={20} />
                            <div>
                                <h4 className="font-bold text-stone-200 group-hover:text-emerald-300 transition-colors">Скринсейвер</h4>
                                <p className="text-xs text-stone-600 font-mono mt-0.5">
                                    {isScreensaverEnabled ? 'Активен (60 сек AFK)' : 'Отключен'}
                                </p>
                            </div>
                        </div>
                        
                        <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isScreensaverEnabled ? 'bg-emerald-900/50 ring-1 ring-emerald-500/50' : 'bg-stone-800 ring-1 ring-stone-700'}`}>
                            <div className={`absolute top-1 bottom-1 w-4 rounded-full bg-current transition-all duration-300 ${isScreensaverEnabled ? 'left-7 text-emerald-400' : 'left-1 text-stone-500'}`} />
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-stone-700 font-mono uppercase tracking-widest">Skazmor Settings v1.0</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

