import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface SaveTemplateModalProps {
    onSave: (name: string) => void;
    onCancel: () => void;
}

const SaveTemplateModal = ({ onSave, onCancel }: SaveTemplateModalProps) => {
    const [name, setName] = useState('');

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onCancel}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-stone-200 uppercase tracking-widest">Сохранить шаблон</h3>
                    <button onClick={onCancel} className="text-stone-500 hover:text-stone-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-stone-500 text-xs font-bold uppercase tracking-widest mb-2">Название шаблона</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например: Агрессивный билд..."
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        autoFocus
                    />
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 font-bold uppercase text-xs tracking-widest transition-colors"
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={() => name.trim() && onSave(name)}
                        disabled={!name.trim()}
                        className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={16} />
                        Сохранить
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SaveTemplateModal;

