import { motion, AnimatePresence } from 'framer-motion';
import { GameStats } from '../types/game';
import { Skull, Trophy, RefreshCw, LogOut } from 'lucide-react';

interface GameStatsOverlayProps {
    stats: GameStats;
    status: 'won' | 'lost';
    playerHp: number;
    onRestart: () => void;
    onExit: () => void;
}

const formatTime = (start: number, end: number | null) => {
    if (!end) return "00:00:00";
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const ms = Math.floor((diff % 1000) / 10); 
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

const StatRow = ({ label, value, color }: { label: string, value: string | number, color?: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-stone-800/50 last:border-0 group hover:bg-white/5 px-2 rounded transition-colors">
        <span className="text-stone-400 text-sm font-medium tracking-wide uppercase">{label}</span>
        <span className={`font-mono font-bold text-lg ${color || 'text-stone-200'}`}>{value}</span>
    </div>
);

export const GameStatsOverlay = ({ stats, status, playerHp, onRestart, onExit }: GameStatsOverlayProps) => {
    const isWin = status === 'won';
    
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className={`pt-8 pb-6 text-center relative overflow-hidden ${isWin ? 'bg-emerald-900/20' : 'bg-rose-900/20'}`}>
                    <div className={`absolute top-0 left-0 w-full h-1 ${isWin ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-500'}`}
                    >
                        {isWin ? <Trophy size={32} /> : <Skull size={32} />}
                    </motion.div>

                    <h2 className={`text-4xl font-black tracking-widest uppercase ${isWin ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {isWin ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
                    </h2>
                    
                    {isWin && (
                        <div className="mt-4 flex flex-col items-center gap-1">
                            <p className="text-emerald-200/60 text-sm font-bold tracking-widest uppercase">
                                Остаток HP: <span className="text-emerald-400 text-lg ml-1">{playerHp}</span>
                            </p>
                            {stats.coinsCollected > 0 && (
                                <motion.p 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-amber-200/60 text-sm font-bold tracking-widest uppercase flex items-center gap-2 bg-amber-900/10 px-3 py-1 rounded-full border border-amber-500/10"
                                >
                                    Добыча: <span className="text-amber-400 text-lg ml-1">+{stats.coinsCollected} 💎</span>
                                </motion.p>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="p-6 space-y-1 bg-stone-900/50">
                    <StatRow label="Убито монстров" value={stats.monstersKilled} color="text-rose-300" />
                    <StatRow label="Собрано монет" value={stats.coinsCollected} color="text-amber-300" />
                    <StatRow label="Вылечено ХП" value={stats.hpHealed} color="text-emerald-300" />
                    <StatRow label="Нанесено урона" value={stats.damageDealt} />
                    <StatRow label="Поглощено урона" value={stats.damageBlocked + stats.damageTaken} />
                    <StatRow label="Сбросов использовано" value={stats.resetsUsed} />
                    <StatRow label="Продано предметов" value={stats.itemsSold} />
                    
                    <div className="pt-4 mt-2">
                        <div className="flex justify-between items-center bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Время игры</span>
                            <span className="font-mono font-bold text-xl text-stone-200">{formatTime(stats.startTime, stats.endTime)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-2 flex gap-3">
                    <button 
                        onClick={onRestart}
                        className="flex-1 py-3 bg-stone-100 hover:bg-white text-stone-900 rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Новая игра
                    </button>
                    <button 
                        onClick={onExit}
                        className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] border border-stone-700 flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Выход
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
