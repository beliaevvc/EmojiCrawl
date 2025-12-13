import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, FolderOpen } from 'lucide-react';
import { DeckTemplate } from '../types/game';
import { getTemplates, deleteTemplate } from '../utils/storage';
import { ConfirmationModal } from './ConfirmationModal';

interface LoadTemplateModalProps {
    onLoad: (template: DeckTemplate) => void;
    onClose: () => void;
}

const LoadTemplateModal = ({ onLoad, onClose }: LoadTemplateModalProps) => {
    const [templates, setTemplates] = useState<DeckTemplate[]>([]);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    useEffect(() => {
        setTemplates(getTemplates());
    }, []);

    const handleDelete = (id: string) => {
        deleteTemplate(id);
        setTemplates(getTemplates());
        setTemplateToDelete(null);
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
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-stone-200 uppercase tracking-widest">Загрузить шаблон</h3>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 -mx-2 px-2">
                    {templates.length === 0 ? (
                        <div className="text-center py-10 text-stone-600 flex flex-col items-center gap-2">
                            <FolderOpen size={48} opacity={0.5} />
                            <p>Нет сохраненных шаблонов</p>
                        </div>
                    ) : (
                        templates.map(template => (
                            <div 
                                key={template.id}
                                className="group flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer"
                                onClick={() => onLoad(template)}
                            >
                                <div>
                                    <h4 className="font-bold text-stone-200 group-hover:text-indigo-300 transition-colors">{template.name}</h4>
                                    <p className="text-xs text-stone-600 font-mono mt-1">
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTemplateToDelete(template.id);
                                    }}
                                    className="p-2 text-stone-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <AnimatePresence>
                    {templateToDelete && (
                        <ConfirmationModal 
                            title="Удалить шаблон?"
                            message="Этот шаблон будет удален безвозвратно."
                            onConfirm={() => handleDelete(templateToDelete)}
                            onCancel={() => setTemplateToDelete(null)}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default LoadTemplateModal;

