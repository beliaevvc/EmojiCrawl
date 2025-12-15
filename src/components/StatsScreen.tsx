import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Skull, Clock, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { getRunHistory, clearHistory } from '../utils/statsStorage';
import { RunHistoryEntry } from '../types/game';
import { ConfirmationModal } from './ConfirmationModal';

interface StatsScreenProps {
  onBack: () => void;
}

const formatTime = (start: number, end: number | null) => {
    if (!end) return "00:00:00";
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const ms = Math.floor((diff % 1000) / 10); 
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const StatItem = ({ label, value, color }: { label: string, value: string | number, color?: string }) => (
    <div className="flex justify-between items-center text-sm py-1 border-b border-stone-800/50 last:border-0">
        <span className="text-stone-500 font-medium">{label}</span>
        <span className={`font-mono font-bold ${color || 'text-stone-300'}`}>{value}</span>
    </div>
);

const HistoryCard = ({ entry }: { entry: RunHistoryEntry }) => {
    const [expanded, setExpanded] = useState(false);
    const isWin = entry.result === 'won';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative bg-stone-900 border rounded-xl overflow-hidden mb-4 transition-all
                ${isWin ? 'border-emerald-900/50 hover:border-emerald-700/50' : 'border-rose-900/50 hover:border-rose-700/50'}
            `}
        >
            {/* Status Stripe */}
            <div className={`absolute top-0 left-0 w-1 h-full ${isWin ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>

            <div 
                className="p-4 pl-6 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold uppercase tracking-widest text-sm ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
                        </span>
                        {entry.runType === 'custom' && (
                            <div className="flex gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/50 px-1.5 py-0.5 rounded bg-indigo-900/20">
                                    Custom
                                </span>
                                {entry.templateName && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded bg-emerald-900/20">
                                        {entry.templateName}
                                    </span>
                                )}
                            </div>
                        )}
                        <span className="text-stone-600 text-xs font-bold">#{entry.gameNumber}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(entry.date)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(entry.startTime, entry.endTime)}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-6 mr-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-stone-500 uppercase">Монстры</span>
                            <span className="text-stone-300 font-bold font-mono">{entry.monstersKilled}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-stone-500 uppercase">Монеты</span>
                            <span className="text-amber-400 font-bold font-mono">{entry.coinsCollected}</span>
                        </div>
                    </div>
                    {expanded ? <ChevronUp size={18} className="text-stone-500" /> : <ChevronDown size={18} className="text-stone-500" />}
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/20 border-t border-stone-800/50"
                    >
                        <div className="p-4 pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-stone-400 uppercase mb-2 tracking-widest">Основное</h4>
                                <StatItem label="Убито монстров" value={entry.monstersKilled} />
                                <StatItem label="Собрано монет" value={entry.coinsCollected} color="text-amber-400" />
                                <StatItem label="Вылечено ХП" value={entry.hpHealed} color="text-emerald-400" />
                                <StatItem label="Нанесено урона" value={entry.damageDealt} />
                                <StatItem label="Сбросов использовано" value={entry.resetsUsed} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-stone-400 uppercase mb-2 tracking-widest">Бой и Оверхеды</h4>
                                <StatItem label="Поглощено щитами" value={entry.damageBlocked} />
                                <StatItem label="Поглощено героем" value={entry.damageTaken} />
                                <StatItem label="Overheal (лечение впустую)" value={entry.overheads.overheal} color="text-stone-400" />
                                <StatItem label="Overkill (избыточный урон)" value={entry.overheads.overdamage} color="text-stone-400" />
                                <StatItem label="Overdef (избыточная защита)" value={entry.overheads.overdef} color="text-stone-400" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const calculateStats = (history: RunHistoryEntry[]) => {
    const stats = {
        standard: { total: 0, wins: 0 },
        custom: { total: 0, wins: 0 },
        template: { total: 0, wins: 0 }
    };

    history.forEach(entry => {
        const isWin = entry.result === 'won';
        
        if (entry.runType === 'standard') {
            stats.standard.total++;
            if (isWin) stats.standard.wins++;
        } else if (entry.runType === 'custom') {
            if (entry.templateName) {
                stats.template.total++;
                if (isWin) stats.template.wins++;
            } else {
                stats.custom.total++;
                if (isWin) stats.custom.wins++;
            }
        }
    });

    return stats;
};

const DashboardCard = ({ title, stats, color }: { title: string, stats: { total: number, wins: number }, color: string }) => {
    const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
    const losses = stats.total - stats.wins;

    return (
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden hover:border-stone-600 transition-all shadow-sm">
            <div className={`absolute top-0 left-0 w-full h-0.5 ${color}`}></div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">{title}</h3>
            
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-mono font-bold text-stone-200 leading-none">{winRate}%</span>
                <span className="text-[9px] text-stone-600 font-bold uppercase tracking-wider">Win Rate</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold font-mono w-full">
                <span className="text-emerald-500">{stats.wins}W</span>
                <span className="text-rose-500">{losses}L</span>
                <div className="flex-1 border-b border-stone-800/50 mx-1"></div>
                <span className="text-stone-500">{stats.total} TOTAL</span>
            </div>
        </div>
    );
};

type FilterType = 'all' | 'standard' | 'custom' | 'template';

const FilterButton = ({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color: string }) => (
    <button
        onClick={onClick}
        className={`
            px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all border
            ${active 
                ? `${color} text-white border-transparent shadow-lg scale-105` 
                : 'bg-stone-900/50 text-stone-500 border-stone-800 hover:border-stone-600 hover:text-stone-300'}
        `}
    >
        {label}
    </button>
);

const StatsScreen = ({ onBack }: StatsScreenProps) => {
    const [history, setHistory] = useState(getRunHistory());
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    
    const stats = calculateStats(history);

    const filteredHistory = history.filter(entry => {
        if (filter === 'all') return true;
        if (filter === 'standard') return entry.runType === 'standard';
        if (filter === 'custom') return entry.runType === 'custom' && !entry.templateName;
        if (filter === 'template') return entry.runType === 'custom' && !!entry.templateName;
        return true;
    });

    const handleClear = () => {
        clearHistory();
        setHistory([]);
        setShowClearConfirm(false);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-screen bg-stone-950 flex flex-col p-4 md:p-8 overflow-hidden"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-6 max-w-2xl mx-auto w-full">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-sm">Назад</span>
                </button>
                
                <h2 className="text-2xl font-bold text-stone-200 uppercase tracking-widest flex items-center gap-3">
                    <Trophy size={24} className="text-stone-500" />
                    История Забегов
                </h2>

                <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="p-2 text-stone-600 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-900/10"
                    title="Очистить историю"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Dashboard Stats */}
            <div className="relative z-10 w-full max-w-2xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <DashboardCard title="Стандарт" stats={stats.standard} color="bg-stone-500" />
                <DashboardCard title="Кастом" stats={stats.custom} color="bg-indigo-500" />
                <DashboardCard title="Шаблоны" stats={stats.template} color="bg-emerald-500" />
            </div>

            {/* Filters */}
            <div className="relative z-10 w-full max-w-2xl mx-auto mb-6 flex justify-center gap-2 md:gap-3">
                <FilterButton 
                    label="Все" 
                    active={filter === 'all'} 
                    onClick={() => setFilter('all')} 
                    color="bg-stone-600"
                />
                <FilterButton 
                    label="Стандарт" 
                    active={filter === 'standard'} 
                    onClick={() => setFilter('standard')} 
                    color="bg-stone-500"
                />
                <FilterButton 
                    label="Кастом" 
                    active={filter === 'custom'} 
                    onClick={() => setFilter('custom')} 
                    color="bg-indigo-500"
                />
                <FilterButton 
                    label="Шаблоны" 
                    active={filter === 'template'} 
                    onClick={() => setFilter('template')} 
                    color="bg-emerald-500"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 w-full max-w-2xl mx-auto overflow-y-auto custom-scrollbar pr-2 pb-20">
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((entry) => (
                        <HistoryCard key={entry.id} entry={entry} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-600 gap-4">
                        <Skull size={48} className="opacity-20" />
                        <p className="uppercase tracking-widest font-bold text-sm">История пуста</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showClearConfirm && (
                    <ConfirmationModal
                        title="Очистка истории"
                        message="Вы уверены, что хотите удалить всю историю забегов? Это действие нельзя отменить."
                        onConfirm={handleClear}
                        onCancel={() => setShowClearConfirm(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StatsScreen;
