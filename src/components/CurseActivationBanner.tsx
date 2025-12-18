import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurseType } from '../types/game';
import { CURSES } from '../data/curses';

interface CurseActivationBannerProps {
    curse: CurseType | null;
}

export const CurseActivationBanner = ({ curse }: CurseActivationBannerProps) => {
    const [visible, setVisible] = useState(false);
    const [activeCurse, setActiveCurse] = useState<CurseType | null>(null);

    useEffect(() => {
        if (curse) {
            setActiveCurse(curse);
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 3500); // Show for 3.5 seconds
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
            setActiveCurse(null);
        }
    }, [curse]);

    const curseDef = activeCurse ? CURSES.find(c => c.id === activeCurse) : null;
    const glowClass = (() => {
        switch (activeCurse) {
            case 'fog':
                return 'bg-stone-400';
            case 'full_moon':
                return 'bg-amber-600';
            case 'poison':
                return 'bg-lime-500';
            case 'tempering':
                return 'bg-cyan-400';
            case 'greed':
                return 'bg-yellow-500';
            case 'darkness':
                return 'bg-indigo-500';
            default:
                return 'bg-stone-600';
        }
    })();

    return (
        <AnimatePresence>
            {visible && curseDef && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute top-1/4 left-0 right-0 z-50 flex flex-col items-center justify-center pointer-events-none"
                >
                    <div className="relative">
                        {/* Backdrop Glow */}
                        <div className={`absolute inset-0 blur-3xl opacity-30 scale-150 ${glowClass}`}></div>
                        
                        <div className="bg-stone-950/90 border border-stone-700 backdrop-blur-md px-10 py-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center max-w-md mx-4 relative overflow-hidden">
                            {/* Decorative Lines */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-stone-500 to-transparent opacity-50"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-stone-500 to-transparent opacity-50"></div>

                            <div className="text-6xl mb-4 filter drop-shadow-xl animate-bounce-slow">
                                {curseDef.icon}
                            </div>
                            
                            <h2 className="text-sm font-bold text-stone-500 uppercase tracking-[0.3em] mb-1">
                                Проклятие Активировано
                            </h2>
                            <h1 className={`text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-2 ${curseDef.color} drop-shadow-md`}>
                                {curseDef.name}
                            </h1>
                            <p className="text-stone-400 text-sm max-w-xs font-serif italic">
                                "{curseDef.description}"
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

