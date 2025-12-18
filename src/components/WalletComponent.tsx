import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '../stores/useWalletStore';
import { Trash2 } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export const WalletComponent = () => {
    const { crystals, resetWallet } = useWalletStore();
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    return (
        <>
            <motion.div 
                className="flex items-center gap-3 pl-4 pr-2 py-2 bg-zinc-900/95 border border-zinc-800/50 rounded-2xl shadow-xl hover:border-amber-500/20 transition-all duration-300 cursor-default select-none group/wallet"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Icon & Value Container */}
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <span className="text-xl filter drop-shadow-lg transform group-hover/wallet:scale-110 transition-transform duration-300">💎</span>
                        {/* Subtle glow behind the gem */}
                        <div className="absolute inset-0 bg-amber-500/10 blur-md rounded-full" />
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none mb-0.5">Кошелек</span>
                        <span className="font-mono text-lg font-bold text-zinc-200 leading-none tracking-tight">
                            {crystals}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-zinc-800/50 ml-1" />

                {/* Reset Button (Always Visible, Grey) */}
                <button
                    onClick={() => setShowResetConfirm(true)}
                    className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all duration-200"
                    title="Сбросить кошелек"
                >
                    <Trash2 size={14} strokeWidth={2.5} />
                </button>
            </motion.div>

            <AnimatePresence>
                {showResetConfirm && (
                    <ConfirmationModal
                        title="Сброс кошелька"
                        message="Вы уверены, что хотите обнулить все накопленные кристаллы? Это действие необратимо."
                        onConfirm={() => {
                            resetWallet();
                            setShowResetConfirm(false);
                        }}
                        onCancel={() => setShowResetConfirm(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
