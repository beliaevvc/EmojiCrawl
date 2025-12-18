import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Play, Swords, RotateCcw, Share2, Download, Copy, Check, X, NotebookPen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NotesModal } from './NotesModal';
import CharacterEditor from './CharacterEditor';
import ShieldsEditor from './ShieldsEditor';
import WeaponsEditor from './WeaponsEditor';
import PotionsEditor from './PotionsEditor';
import CoinsEditor from './CoinsEditor';
import SpellsEditor from './SpellsEditor';
import MonstersEditor, { DEFAULT_MONSTER_GROUPS } from './MonstersEditor';
import { DeckConfig, SpellType, MonsterGroupConfig, DeckTemplate, CurseType } from '../types/game';
import { BASE_SPELLS } from '../data/spells';
import { ConfirmationModal } from './ConfirmationModal';
import SaveTemplateModal from './SaveTemplateModal';
import { saveTemplate } from '../utils/storage';
import { encodeDeckConfig, decodeDeckConfig } from '../utils/shareUtils';
import { CURSES } from '../data/curses';
import { CursePicker } from './CursePicker';
import { MaskedFlashlightOverlay } from './MaskedFlashlightOverlay';
import { setFlashlightLocked } from '../utils/flashlightLock';

// ... (CategoryCard component remains same)
const CategoryCard = ({ 
    icon, 
    label, 
    count, 
    onClick,
    accentColor = "stone",
    isModified = false,
    subtitle
}: { 
    icon: string; 
    label: string; 
    count?: number; 
    onClick?: () => void;
    accentColor?: "stone" | "rose" | "emerald" | "amber" | "indigo" | "sky" | "purple";
    isModified?: boolean;
    subtitle?: string;
}) => {
    const styles = {
        stone: { 
            border: "border-stone-400", 
            bg: "bg-stone-800/80", 
            shadow: "shadow-stone-900/50",
            ring: "ring-stone-600/30",
            text: "text-stone-400",
            glow: "group-hover:bg-stone-500/5"
        },
        rose: { 
            border: "border-rose-800", 
            bg: "bg-rose-950/40", 
            shadow: "shadow-rose-900/50",
            ring: "ring-rose-600/30",
            text: "text-rose-400",
            glow: "group-hover:bg-rose-500/5"
        },
        emerald: { 
            border: "border-emerald-700", 
            bg: "bg-stone-800/80", 
            shadow: "shadow-emerald-900/50",
            ring: "ring-emerald-600/30",
            text: "text-emerald-400",
            glow: "group-hover:bg-emerald-500/5"
        },
        amber: { 
            border: "border-amber-500", 
            bg: "bg-stone-800/80", 
            shadow: "shadow-amber-900/50",
            ring: "ring-amber-600/30",
            text: "text-amber-400",
            glow: "group-hover:bg-amber-500/5"
        },
        indigo: { 
            border: "border-indigo-500", 
            bg: "bg-stone-800/80", 
            shadow: "shadow-indigo-900/50",
            ring: "ring-indigo-600/30",
            text: "text-indigo-400",
            glow: "group-hover:bg-indigo-500/5"
        },
        sky: { 
            border: "border-sky-500", 
            bg: "bg-stone-800/80", 
            shadow: "shadow-sky-900/50",
            ring: "ring-sky-600/30",
            text: "text-sky-400",
            glow: "group-hover:bg-sky-500/5"
        },
        purple: {
            border: "border-purple-500",
            bg: "bg-stone-800/80",
            shadow: "shadow-purple-900/50",
            ring: "ring-purple-600/30",
            text: "text-purple-400",
            glow: "group-hover:bg-purple-500/5"
        }
    }[accentColor];

    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative group cursor-pointer overflow-hidden
                flex flex-col items-center justify-center gap-4
                h-48 w-full rounded-2xl 
                bg-stone-900/40 backdrop-blur-sm border border-stone-800
                transition-all duration-300
                hover:border-stone-600 hover:shadow-2xl
            `}
        >
            <div className={`absolute inset-0 transition-colors duration-500 ${styles.glow}`}></div>
            
            {/* Background Pattern/Icon Faded */}
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] select-none pointer-events-none filter grayscale contrast-200">
                {icon}
            </div>

            {/* Game Token Style Circle */}
            <div className={`
                relative z-10 
                w-20 h-20 rounded-full flex items-center justify-center text-4xl
                border-2 ${styles.border} ${styles.bg}
                shadow-[0_0_15px_rgba(0,0,0,0.3)]
                ring-4 ${styles.ring}
                group-hover:scale-110 transition-transform duration-300
            `}>
                {icon}
            </div>

            <div className="flex flex-col items-center z-10">
                <span className={`font-bold uppercase tracking-widest text-xs transition-colors duration-300 ${styles.text} group-hover:text-stone-200`}>
                    {label}
                </span>
                {count !== undefined && (
                    <span className="text-[10px] text-stone-500 font-mono mt-1 group-hover:text-stone-400 transition-colors">
                        {count} items
                    </span>
                )}
                {subtitle && (
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-1 group-hover:text-stone-400 transition-colors">
                        {subtitle}
                    </span>
                )}
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3">
                 {isModified && (
                    <div className="bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse flex items-center">
                        EDITED
                    </div>
                )}
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
                {count !== undefined && (
                    <div className="w-6 h-6 bg-stone-950/80 border border-stone-800 text-stone-400 text-[10px] font-mono font-bold flex items-center justify-center rounded-full backdrop-blur-sm shadow-sm">
                        {count}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ExportModal = ({ config, onClose }: { config: DeckConfig, onClose: () => void }) => {
    const [copied, setCopied] = useState(false);
    const code = encodeDeckConfig(config);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-stone-200 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Share2 size={20} className="text-indigo-400" /> Поделиться колодой
                </h2>
                <p className="text-stone-400 text-sm mb-4">Скопируйте этот код, чтобы передать вашу колоду другу.</p>
                
                <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 mb-4 relative group">
                    <div className="text-stone-300 font-mono text-xs break-all max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {code}
                    </div>
                </div>

                <button 
                    onClick={handleCopy}
                    className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                >
                    {copied ? <><Check size={16} /> Скопировано!</> : <><Copy size={16} /> Копировать код</>}
                </button>
            </div>
        </motion.div>
    );
};

const ImportModal = ({ onImport, onClose }: { onImport: (config: DeckConfig) => void, onClose: () => void }) => {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        if (!code.trim()) return;
        const config = decodeDeckConfig(code.trim());
        if (config) {
            onImport(config);
            onClose();
        } else {
            setError("Неверный код колоды. Проверьте правильность.");
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-stone-200 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Download size={20} className="text-amber-400" /> Импорт колоды
                </h2>
                <p className="text-stone-400 text-sm mb-4">Вставьте код колоды, полученный от друга.</p>
                
                <textarea 
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value);
                        setError(null);
                    }}
                    placeholder="Вставьте код здесь..."
                    className="w-full h-32 bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-300 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none mb-2"
                />
                
                {error && <p className="text-rose-400 text-xs mb-4 flex items-center gap-1"><X size={12}/> {error}</p>}

                <button 
                    onClick={handleImport}
                    disabled={!code.trim()}
                    className="w-full py-3 bg-stone-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
                >
                    <Download size={16} /> Загрузить
                </button>
            </div>
        </motion.div>
    );
};

interface DeckbuilderScreenProps {
    onBack: () => void;
    onStartStandard: () => void;
    onStartCustom: (config: DeckConfig, templateName?: string) => void;
    initialTemplate?: DeckTemplate | null;
}

const DeckbuilderScreen = ({ onBack, onStartStandard, onStartCustom, initialTemplate }: DeckbuilderScreenProps) => {
    
    // Config State
    const [customPlayer, setCustomPlayer] = useState({ hp: 13, maxHp: 13, coins: 0 });
    const [customShields, setCustomShields] = useState<number[]>([2, 3, 4, 5, 6, 7]);
    const [customWeapons, setCustomWeapons] = useState<number[]>([2, 3, 4, 5, 6, 7]);
    const [customPotions, setCustomPotions] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [customCoins, setCustomCoins] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [customSpells, setCustomSpells] = useState<SpellType[]>([...BASE_SPELLS]);
    const [customMonsters, setCustomMonsters] = useState<MonsterGroupConfig[]>(DEFAULT_MONSTER_GROUPS);
    const [customCurse, setCustomCurse] = useState<CurseType | null>(null);

    // Curse "Тьма": lock Lumos/Nox flashlight while active (front-only)
    useEffect(() => {
        const locked = customCurse === 'darkness';
        setFlashlightLocked(locked);
        return () => {
            // Ensure unlock on unmount
            setFlashlightLocked(false);
        };
    }, [customCurse]);

    // Initial Load
    useEffect(() => {
        if (initialTemplate) {
            const { config } = initialTemplate;
            setCustomPlayer({ ...config.character, maxHp: config.character.hp });
            setCustomShields(config.shields);
            setCustomWeapons(config.weapons);
            setCustomPotions(config.potions);
            setCustomCoins(config.coins);
            setCustomSpells(config.spells);
            setCustomMonsters(config.monsters);
            setCustomCurse(config.curse || null);
        }
    }, [initialTemplate]);

    // Modals
    const [showCharacterEditor, setShowCharacterEditor] = useState(false);
    const [showShieldsEditor, setShowShieldsEditor] = useState(false);
    const [showWeaponsEditor, setShowWeaponsEditor] = useState(false);
    const [showPotionsEditor, setShowPotionsEditor] = useState(false);
    const [showCoinsEditor, setShowCoinsEditor] = useState(false);
    const [showSpellsEditor, setShowSpellsEditor] = useState(false);
    const [showMonstersEditor, setShowMonstersEditor] = useState(false);
    const [showCursePicker, setShowCursePicker] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showNotes, setShowNotes] = useState(false);

    // Checks
    const arraysEqual = (a: any[], b: any[]) => {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, index) => val === sortedB[index]);
    };

    const isCharacterModified = customPlayer.hp !== 13 || customPlayer.coins !== 0;
    const isShieldsModified = JSON.stringify(customShields.slice().sort((a,b) => a-b)) !== JSON.stringify([2, 3, 4, 5, 6, 7].slice().sort((a,b) => a-b));
    const isWeaponsModified = JSON.stringify(customWeapons.slice().sort((a,b) => a-b)) !== JSON.stringify([2, 3, 4, 5, 6, 7].slice().sort((a,b) => a-b));
    const isPotionsModified = JSON.stringify(customPotions.slice().sort((a,b) => a-b)) !== JSON.stringify([2, 3, 4, 5, 6, 7, 8, 9, 10].slice().sort((a,b) => a-b));
    const isCoinsModified = JSON.stringify(customCoins.slice().sort((a,b) => a-b)) !== JSON.stringify([2, 3, 4, 5, 6, 7, 8, 9, 10].slice().sort((a,b) => a-b));
    const isSpellsModified = !arraysEqual(customSpells, BASE_SPELLS);
    const isMonstersModified = JSON.stringify(customMonsters) !== JSON.stringify(DEFAULT_MONSTER_GROUPS);
    const isCurseModified = customCurse !== null;

    // Total Counts
    const monsterCount = customMonsters.reduce((acc, g) => acc + g.count, 0);
    const totalCards = customShields.length + customWeapons.length + customPotions.length + customCoins.length + customSpells.length + monsterCount;

    const getCurrentConfig = (): DeckConfig => ({
        character: customPlayer,
        shields: customShields,
        weapons: customWeapons,
        potions: customPotions,
        coins: customCoins,
        spells: customSpells,
        monsters: customMonsters,
        curse: customCurse
    });

    const handleStartCustom = () => {
        onStartCustom(getCurrentConfig(), initialTemplate?.name);
    };

    const handleResetAll = () => {
        setCustomPlayer({ hp: 13, maxHp: 13, coins: 0 });
        setCustomShields([2, 3, 4, 5, 6, 7]);
        setCustomWeapons([2, 3, 4, 5, 6, 7]);
        setCustomPotions([2, 3, 4, 5, 6, 7, 8, 9, 10]);
        setCustomCoins([2, 3, 4, 5, 6, 7, 8, 9, 10]);
        setCustomSpells([...BASE_SPELLS]);
        setCustomMonsters([...DEFAULT_MONSTER_GROUPS]);
        setCustomCurse(null);
        setShowResetConfirm(false);
    };

    const handleSaveTemplate = (name: string) => {
        const template: DeckTemplate = {
            id: Date.now().toString(),
            name,
            config: getCurrentConfig(),
            createdAt: Date.now()
        };
        saveTemplate(template);
        setShowSaveTemplate(false);
        // Maybe show toast? Or just close.
    };

    const handleImportConfig = (config: DeckConfig) => {
        setCustomPlayer({ ...config.character, maxHp: config.character.hp });
        setCustomShields(config.shields);
        setCustomWeapons(config.weapons);
        setCustomPotions(config.potions);
        setCustomCoins(config.coins);
        setCustomSpells(config.spells);
        setCustomMonsters(config.monsters);
        setCustomCurse(config.curse || null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-screen bg-[#141211] flex flex-col relative overflow-hidden font-sans select-none"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/20 via-stone-950/80 to-stone-950 pointer-events-none z-0"></div>

            {/* Curse "Тьма" overlay: darken deckbuilder content, but keep header/footer/modals visible */}
            <MaskedFlashlightOverlay
                enabled={customCurse === 'darkness'}
                radiusPx={150}
                softEdgePercent={10}
                zIndexClassName="z-[15]"
            />

            {/* Header - Fixed */}
            <div className="relative z-10 w-full px-4 py-4 flex justify-between items-center bg-[#141211]/80 backdrop-blur-md border-b border-stone-800 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold tracking-widest uppercase text-sm hidden md:inline">Назад</span>
                    </button>
                    <div>
                        <h1 className="font-display font-bold text-xl md:text-3xl text-stone-200 tracking-wider uppercase">
                            Конструктор
                        </h1>
                        <p className="text-stone-500 text-xs flex items-center gap-2">
                            Всего карт: <span className="text-stone-300 font-mono">{totalCards}</span>
                            {initialTemplate && <span className="px-2 py-0.5 bg-indigo-900/30 text-indigo-400 rounded text-[10px] uppercase border border-indigo-900/50">{initialTemplate.name}</span>}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowNotes(true)}
                        className="flex items-center gap-2 text-stone-500 hover:text-indigo-300 transition-colors group mr-2"
                        title="Заметки"
                    >
                        <NotebookPen size={20} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <button 
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 text-stone-500 hover:text-amber-400 transition-colors group"
                        title="Импорт колоды"
                    >
                        <Download size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 text-stone-500 hover:text-indigo-400 transition-colors group"
                        title="Поделиться колодой"
                    >
                        <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="w-px h-4 bg-stone-800 mx-1"></div>
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-2 text-stone-500 hover:text-rose-400 transition-colors group"
                        title="Сбросить все настройки"
                    >
                        <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-32 w-full">
                <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto z-10 relative">
                
                <div className="text-center mb-12 mt-4">
                    <h2 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-stone-200 to-stone-500 uppercase tracking-tighter drop-shadow-2xl relative inline-block">
                        Deckbuilder
                        <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-stone-500 to-transparent opacity-50"></div>
                    </h2>
                </div>

                <div className="flex items-center gap-6 w-full max-w-5xl mb-8 opacity-80">
                    <div className="h-px bg-gradient-to-r from-transparent to-stone-800 flex-1"></div>
                    <h3 className="text-stone-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
                        Выберите категорию
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
                    </h3>
                    <div className="h-px bg-gradient-to-l from-transparent to-stone-800 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl mb-12 px-2">
                     {/* Character */}
                    <CategoryCard 
                        icon="🧙‍♂️" 
                        label="Персонаж" 
                        accentColor="sky"
                        onClick={() => setShowCharacterEditor(true)}
                        isModified={isCharacterModified}
                    />

                    <CategoryCard 
                        icon="🐺" 
                        label="Монстры" 
                        count={monsterCount} 
                        accentColor="rose"
                        onClick={() => setShowMonstersEditor(true)}
                        isModified={isMonstersModified}
                    />
                    
                    {/* Weapons */}
                    <CategoryCard 
                        icon="⚔️" 
                        label="Оружие" 
                        count={customWeapons.length} 
                        accentColor="stone"
                        onClick={() => setShowWeaponsEditor(true)}
                        isModified={isWeaponsModified}
                    />

                    {/* Shields */}
                    <CategoryCard 
                        icon="🛡️" 
                        label="Щиты" 
                        count={customShields.length} 
                        accentColor="stone"
                        onClick={() => setShowShieldsEditor(true)}
                        isModified={isShieldsModified}
                    />

                    {/* Potions */}
                    <CategoryCard 
                        icon="🧪" 
                        label="Зелья" 
                        count={customPotions.length} 
                        accentColor="emerald"
                        onClick={() => setShowPotionsEditor(true)}
                        isModified={isPotionsModified}
                    />
                    
                    {/* Coins */}
                    <CategoryCard 
                        icon="💎" 
                        label="Кристаллы" 
                        count={customCoins.length} 
                        accentColor="amber"
                        onClick={() => setShowCoinsEditor(true)}
                        isModified={isCoinsModified}
                    />

                    {/* Spells */}
                    <CategoryCard 
                        icon="📜" 
                        label="Заклинания" 
                        count={customSpells.length} 
                        accentColor="indigo"
                        onClick={() => setShowSpellsEditor(true)}
                        isModified={isSpellsModified}
                    />
                </div>

                {/* Modifiers Section */}
                <div className="w-full max-w-5xl mx-auto mt-8 mb-16 px-2">
                    <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                        Модификаторы
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Curse */}
                        <CategoryCard 
                            icon={customCurse ? (CURSES.find(c => c.id === customCurse)?.icon || "👻") : "👻"}
                            label="Проклятие"
                            subtitle={customCurse ? CURSES.find(c => c.id === customCurse)?.name : "Нет"}
                            accentColor="purple"
                            onClick={() => setShowCursePicker(true)}
                            isModified={isCurseModified}
                        />
                    </div>
                </div>
                </div>
            </div>

            {/* Bottom Actions - Fixed */}
            <div className="relative z-10 w-full p-4 bg-[#141211]/80 backdrop-blur-md border-t border-stone-800 shrink-0">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 justify-center items-center">
                    <button 
                        onClick={() => setShowSaveTemplate(true)}
                        className="w-full md:w-auto px-6 py-4 bg-stone-900 border border-stone-700 hover:border-stone-500 rounded-xl flex items-center justify-center gap-3 text-stone-400 hover:text-stone-200 transition-all font-bold uppercase tracking-widest text-xs group"
                    >
                        <Save size={18} className="group-hover:scale-110 transition-transform"/>
                        Сохранить шаблон
                    </button>
                    
                    <button 
                        onClick={handleStartCustom}
                        className="w-full md:w-auto px-6 py-4 bg-stone-900 border border-stone-700 hover:border-indigo-500 rounded-xl flex items-center justify-center gap-3 text-stone-400 hover:text-indigo-300 transition-all font-bold uppercase tracking-widest text-xs group"
                    >
                        <Swords size={18} className="group-hover:rotate-12 transition-transform"/>
                        Начать кастом забег
                    </button>

                    <button 
                        onClick={onStartStandard}
                        className="w-full md:w-auto px-8 py-4 bg-stone-100 text-stone-950 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:scale-105 transition-all shadow-lg shadow-stone-900/50"
                    >
                        <Play size={18} fill="currentColor" />
                        Начать обычный забег
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {/* ... existing modals ... */}
                {showCharacterEditor && (
                    <CharacterEditor 
                        initialStats={customPlayer}
                        onSave={(stats) => {
                            setCustomPlayer(stats);
                            setShowCharacterEditor(false);
                        }}
                        onClose={() => setShowCharacterEditor(false)}
                    />
                )}
                {showShieldsEditor && (
                    <ShieldsEditor 
                        initialValues={customShields}
                        onSave={(shields) => {
                            setCustomShields(shields);
                            setShowShieldsEditor(false);
                        }}
                        onClose={() => setShowShieldsEditor(false)}
                    />
                )}
                {showWeaponsEditor && (
                    <WeaponsEditor 
                        initialValues={customWeapons}
                        onSave={(weapons) => {
                            setCustomWeapons(weapons);
                            setShowWeaponsEditor(false);
                        }}
                        onClose={() => setShowWeaponsEditor(false)}
                    />
                )}
                {showPotionsEditor && (
                    <PotionsEditor 
                        initialValues={customPotions}
                        onSave={(potions) => {
                            setCustomPotions(potions);
                            setShowPotionsEditor(false);
                        }}
                        onClose={() => setShowPotionsEditor(false)}
                    />
                )}
                {showCoinsEditor && (
                    <CoinsEditor 
                        initialValues={customCoins}
                        onSave={(coins) => {
                            setCustomCoins(coins);
                            setShowCoinsEditor(false);
                        }}
                        onClose={() => setShowCoinsEditor(false)}
                    />
                )}
                {showSpellsEditor && (
                    <SpellsEditor 
                        initialValues={customSpells}
                        onSave={(spells) => {
                            setCustomSpells(spells);
                            setShowSpellsEditor(false);
                        }}
                        onClose={() => setShowSpellsEditor(false)}
                    />
                )}
                {showMonstersEditor && (
                    <MonstersEditor 
                        initialGroups={customMonsters}
                        onSave={(groups) => {
                            setCustomMonsters(groups);
                            setShowMonstersEditor(false);
                        }}
                        onClose={() => setShowMonstersEditor(false)}
                    />
                )}
                {showCursePicker && (
                    <CursePicker 
                        onSelect={(curse) => {
                            // If re-selecting same, untoggle? No, need a clear button.
                            // Assuming CursePicker only allows selection. 
                            // If already selected, maybe just update?
                            setCustomCurse(curse);
                            setShowCursePicker(false);
                        }}
                        onClose={() => setShowCursePicker(false)}
                    />
                )}
                {showResetConfirm && (
                    <ConfirmationModal 
                        title="Сбросить все?"
                        message="Вы уверены, что хотите сбросить все настройки колоды к стандартным значениям?"
                        onConfirm={handleResetAll}
                        onCancel={() => setShowResetConfirm(false)}
                    />
                )}
                {showSaveTemplate && (
                    <SaveTemplateModal 
                        onSave={handleSaveTemplate}
                        onCancel={() => setShowSaveTemplate(false)}
                    />
                )}
                {showExportModal && (
                    <ExportModal 
                        config={getCurrentConfig()}
                        onClose={() => setShowExportModal(false)}
                    />
                )}
                {showImportModal && (
                    <ImportModal 
                        onImport={handleImportConfig}
                        onClose={() => setShowImportModal(false)}
                    />
                )}
                {showNotes && <NotesModal onClose={() => setShowNotes(false)} />}
            </AnimatePresence>
        </motion.div>
    );
};

export default DeckbuilderScreen;
