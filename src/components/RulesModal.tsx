import { motion } from 'framer-motion';
import { X, Skull, Swords, Shield, Coins, Zap, Trophy, AlertTriangle } from 'lucide-react';
import { CardType } from '../types/game';

interface VisualCardProps {
    type: CardType;
    value?: number;
    icon: string;
    name?: string;
    description?: string;
}

// Visual Card Component for Examples
const VisualCard = ({ icon, name, description, type, value }: VisualCardProps) => {
    let borderColor = 'border-stone-700';
    let bgColor = 'bg-stone-800/80';

    switch (type) {
        case 'monster':
            borderColor = 'border-rose-800';
            bgColor = 'bg-rose-950/40';
            break;
        case 'weapon':
            borderColor = 'border-stone-400';
            bgColor = 'bg-stone-800/80';
            break;
        case 'shield':
            borderColor = 'border-stone-600';
            bgColor = 'bg-stone-800/80';
            break;
        case 'potion':
            borderColor = 'border-emerald-700';
            bgColor = 'bg-emerald-950/40';
            break;
        case 'coin':
            borderColor = 'border-amber-500';
            bgColor = 'bg-amber-950/40';
            break;
        case 'spell':
            borderColor = 'border-indigo-500';
            bgColor = 'bg-indigo-950/40';
            break;
    }

    return (
        <div className="flex flex-col items-center text-center gap-1">
            <div className={`
                relative w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg
                border-2 ${borderColor} ${bgColor}
            `}>
                <span className="drop-shadow-md">{icon}</span>
                {value !== undefined && value > 0 && (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black/60 border border-stone-600 flex items-center justify-center text-xs font-bold text-stone-300 font-mono">
                        {value}
                    </span>
                )}
            </div>
            <div className="text-xs font-bold text-stone-200 uppercase tracking-wider mt-1">{name || type}</div>
            {description && <p className="text-[10px] text-stone-400 leading-tight">{description}</p>}
        </div>
    );
};

// Visual Avatar for Rules
const VisualAvatar = () => (
    <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto my-4">
        {/* Main Circle */}
        <div className="w-full h-full rounded-full border-4 border-stone-400 bg-stone-800 flex items-center justify-center text-4xl md:text-5xl shadow-xl z-10 relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rose-900/50 to-transparent h-1/2"></div>
            🧙‍♂️
        </div>
        
        {/* HP (Bottom) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-900 border-2 border-green-500 rounded-full flex items-center justify-center text-xs font-bold text-green-100 z-20 shadow-md">
            13
        </div>
        
        {/* Coins (Right) */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center z-20">
            <div className="w-6 h-6 bg-stone-700 border border-stone-500 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-300 shadow-md">
               5
            </div>
        </div>
    </div>
);

export const RulesModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-xl max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-stone-800 bg-stone-900/50 flex justify-between items-center">
                    <h2 className="text-xl md:text-2xl font-display font-bold text-stone-200 tracking-widest uppercase flex items-center gap-2">
                        <span className="text-rose-500">📜</span> Правила
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-1 hover:bg-stone-800 rounded">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
                    
                    {/* 1. Intro */}
                    <section className="space-y-2">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">1.</span> Что это за игра
                        </h3>
                        <div className="bg-stone-800/50 p-3 rounded-lg border border-stone-700/50 text-stone-300 text-sm leading-relaxed">
                            <p><strong>SKAZMOR</strong> — это боевой карточный пасьянс с ролевыми элементами.</p>
                            <p className="mt-1">У вас есть аватар, немного жизни и колода из 54 монет. Ваша задача — пережить всю колоду и остаться в живых.</p>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 2. Avatar */}
                    <section className="space-y-2">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">2.</span> Ваш Аватар
                        </h3>
                        <div className="flex flex-col md:flex-row items-center gap-6 bg-stone-950/30 p-4 rounded-lg border border-stone-800">
                            <VisualAvatar />
                            <ul className="space-y-4 text-sm text-stone-300 flex-1">
                                <li className="flex items-start gap-3">
                                    <div className="flex items-center -space-x-2 mt-0.5">
                                        <span className="w-7 h-7 bg-green-900 border border-green-500 rounded-full flex items-center justify-center text-xs font-bold text-green-100 z-10 shadow-sm">13</span>
                                        <span className="w-7 h-7 bg-stone-800 border border-stone-600 rounded-full flex items-center justify-center text-sm shadow-sm z-0 pl-1 text-stone-400">⚔️</span>
                                    </div>
                                    <div>
                                        <b className="text-white block">HP (Здоровье) = Атака</b>
                                        <span className="text-stone-400 text-xs">Ваша сила равна вашему здоровью. Чем вы здоровее, тем сильнее бьете. 0 HP = поражение.</span>
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="w-7 h-7 bg-stone-700 border border-stone-500 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-300 shadow-sm flex-shrink-0">5</span>
                                    <span><b>Кристаллы</b> — валюта для покупок (пока не используется).</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 3. Field */}
                    <section className="space-y-2">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">3.</span> Поле игры
                        </h3>
                        <div className="grid grid-cols-1 gap-4 text-sm text-stone-400 bg-stone-800/30 p-3 rounded-lg">
                            <div>
                                <strong className="text-stone-200 block mb-1">8 слотов вокруг аватара:</strong>
                                <ul className="list-disc list-inside space-y-1 pl-1">
                                    <li>4 сверху — <span className="text-rose-400 font-bold">Зона опасности</span> (враги и лут).</li>
                                    <li>4 снизу — <span className="text-emerald-400 font-bold">Ваша территория</span> (Руки, Рюкзак, Аватар).</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 4. Round */}
                    <section className="space-y-2">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">4.</span> Что происходит в раунде
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-stone-300 bg-stone-800/30 p-3 rounded-lg">
                            <li>В верхнюю часть выкладываются <span className="text-white font-bold">4 монеты</span>.</li>
                            <li>Ваша цель — убрать <span className="text-white font-bold">3 из них</span> любым способом.</li>
                            <li>Убрали → начинается новый раунд → выкладываются новые монеты.</li>
                        </ol>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 5. Hands & Items */}
                    <section className="space-y-4">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">5.</span> Руки и предметы
                        </h3>
                        <div className="flex gap-4 items-center justify-center py-2 bg-stone-950/50 rounded-lg border border-stone-800 flex-wrap">
                            <VisualCard type="weapon" icon="⚔️" name="Оружие" value={4} />
                            <VisualCard type="shield" icon="🛡️" name="Щит" value={3} />
                            <VisualCard type="potion" icon="🧪" name="Зелье" value={2} />
                            <VisualCard type="spell" icon="📜" name="Заклинание" />
                            <VisualCard type="coin" icon="💎" name="Кристалл" value={1} />
                        </div>
                        <ul className="space-y-2 text-sm text-stone-400">
                            <li className="flex items-start gap-2"><Swords size={16} className="mt-0.5 text-stone-500" /> <span><b>Оружие</b> — атакует врагов.</span></li>
                            <li className="flex items-start gap-2"><Shield size={16} className="mt-0.5 text-blue-500" /> <span><b>Щит</b> — защищает от урона.</span></li>
                            <li className="flex items-start gap-2"><div className="mt-0.5">🧪</div> <span><b>Зелье</b> — лечит (используется сразу).</span></li>
                            <li className="flex items-start gap-2"><Zap size={16} className="mt-0.5 text-indigo-500" /> <span><b>Заклинание</b> — либо атакует, либо усиливает.</span></li>
                            <li className="flex items-start gap-2"><Coins size={16} className="mt-0.5 text-amber-500" /> <span><b>Кристаллы</b> — пополняют кошелёк (сразу).</span></li>
                        </ul>
                        <p className="text-xs text-stone-500 italic text-center border-t border-stone-800 pt-2">
                            * Монстров в руки класть нельзя!
                        </p>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 6. Backpack & Selling */}
                    <section className="space-y-4">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">6.</span> Рюкзак и продажа
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {/* Backpack */}
                            <div className="flex items-center gap-4 bg-stone-950/30 p-3 rounded-lg border border-stone-800">
                                <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-stone-700/50 bg-stone-800/30 flex items-center justify-center shrink-0">
                                    <span className="text-3xl text-stone-600 grayscale opacity-40">🎒</span>
                                </div>
                                <div className="text-sm text-stone-300">
                                    <b className="text-white block">Рюкзак (Инвентарь)</b>
                                    Хранит 1 предмет. Перетащите сюда карту, чтобы сохранить её на следующий раунд.
                                </div>
                            </div>

                            {/* Sell */}
                            <div className="flex items-center gap-4 bg-stone-950/30 p-3 rounded-lg border border-stone-800">
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-rose-900/20 border-2 border-rose-500/50 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(225,29,72,0.3)]">
                                        💎
                                    </div>
                                    <span className="text-[10px] font-bold tracking-widest text-rose-300 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm uppercase">
                                        ПРОДАТЬ
                                    </span>
                                </div>
                                <div className="text-sm text-stone-300">
                                    <b className="text-white block">Продажа (сверху или из рюкзака)</b>
                                    <ul className="list-disc list-inside text-stone-400 pl-1 text-xs mt-1 space-y-1">
                                        <li>Оружие / Щиты / Зелья → дают <span className="text-amber-400">💎 Кристаллы</span>.</li>
                                        <li>Заклинания и Кристаллы → продать нельзя.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 7. Emergency */}
                    <section className="space-y-2">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">7.</span> Экстренные меры
                        </h3>
                        <div className="flex items-center gap-4 bg-stone-800/50 p-3 rounded-lg border border-stone-700/50">
                            
                            {/* Visual Reset Button */}
                            <div className="group flex flex-col items-center gap-1 scale-90">
                                <div className="relative">
                                    <div className="w-14 h-16 bg-stone-800/80 border border-stone-600 rounded-b-3xl rounded-t-sm flex items-center justify-center text-3xl shadow-lg">
                                        🛡️
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                                        <div className="w-0.5 h-full bg-stone-950 rotate-12"></div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold tracking-widest text-stone-400 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm uppercase">Сброс (-5HP)</span>
                            </div>

                            <div className="text-sm text-stone-300">
                                <strong className="text-white block mb-1">Как работает:</strong>
                                <ul className="list-disc list-inside text-stone-400 space-y-1">
                                    <li>Возвращает 4 верхние монеты в колоду.</li>
                                    <li>Стоит <span className="text-rose-400 font-bold">5 жизней</span>.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 8. Curses */}
                    <section className="space-y-4">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">8.</span> Проклятья
                        </h3>
                        
                        <div className="flex flex-col md:flex-row items-center gap-6 bg-stone-950/30 p-4 rounded-lg border border-stone-800">
                            {/* Visual Curse Token */}
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-4xl shadow-lg relative z-10">
                                    <span className="filter drop-shadow-lg">☁️</span>
                                </div>
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-stone-400/20 blur-xl rounded-full scale-125 pointer-events-none"></div>
                            </div>

                            <div className="text-sm text-stone-300 space-y-2">
                                <p>
                                    Иногда в начале игры появляются <strong>Проклятья</strong>. Не пугайтесь названия — это особые условия, которые меняют правила забега.
                                </p>
                                <ul className="list-disc list-inside text-stone-400 space-y-1">
                                    <li>Они могут быть как <span className="text-rose-400">негативными</span> (усложнять игру), так и <span className="text-emerald-400">позитивными</span> (давать бонусы).</li>
                                    <li>Выбор проклятья доступен <strong>только до первого действия</strong>.</li>
                                    <li>Как только вы сделали ход — проклятье фиксируется (или пропадает, если не выбрано) до конца игры.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 9. Win/Loss */}
                    <section className="space-y-2">
                        <h3 className="text-stone-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-rose-500">9.</span> Победа и поражение
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-950/20 border border-emerald-900/50 p-3 rounded-lg">
                                <strong className="text-emerald-400 flex items-center gap-2 mb-2"><Trophy size={16} /> Победа</strong>
                                <ul className="text-sm text-stone-400 list-disc list-inside">
                                    <li>Колода пуста</li>
                                    <li>Верхняя зона пуста</li>
                                    <li>Есть хотя бы 1 ❤️</li>
                                </ul>
                            </div>
                            <div className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-lg">
                                <strong className="text-rose-400 flex items-center gap-2 mb-2"><Skull size={16} /> Поражение</strong>
                                <p className="text-sm text-stone-400">Если жизни (HP) опустились до 0 или ниже.</p>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-stone-800"></div>

                    {/* 9. Important */}
                    <section className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg">
                        <h3 className="text-amber-500 font-bold text-lg flex items-center gap-2 mb-2">
                            <AlertTriangle size={18} /> Важно
                        </h3>
                        <p className="text-sm text-amber-200/80 leading-relaxed">
                            Это прототип. Правила могут меняться, появляться новые механики.
                            Если что-то не описано — значит, мы это ещё тестируем.
                        </p>
                    </section>

                </div>
            </motion.div>
        </motion.div>
    );
};

