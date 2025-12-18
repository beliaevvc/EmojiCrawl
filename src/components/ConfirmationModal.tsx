import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
}

export const ConfirmationModal = ({ onConfirm, onCancel, title, message }: ConfirmationModalProps) => {
    return createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onCancel}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-600 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
                <div className="mx-auto w-12 h-12 bg-rose-900/20 rounded-full flex items-center justify-center mb-4 text-rose-500">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-bold text-stone-200 mb-2">{title}</h3>
                <p className="text-stone-400 mb-6 text-sm leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-stone-800 text-stone-300 rounded-lg border border-stone-700 hover:bg-stone-700 hover:border-stone-600 transition-colors text-xs font-bold tracking-widest uppercase"
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-rose-900/80 text-rose-100 rounded-lg border border-rose-700 hover:bg-rose-800 hover:border-rose-600 transition-colors text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                    >
                        Подтвердить
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
