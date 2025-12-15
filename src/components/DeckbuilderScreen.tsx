import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Play, Swords, RotateCcw, Share2, Download, Copy, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import CharacterEditor from './CharacterEditor';
import ShieldsEditor from './ShieldsEditor';
import WeaponsEditor from './WeaponsEditor';
import PotionsEditor from './PotionsEditor';
import CoinsEditor from './CoinsEditor';
import SpellsEditor from './SpellsEditor';
import MonstersEditor, { DEFAULT_MONSTER_GROUPS } from './MonstersEditor';
import { DeckConfig, SpellType, MonsterGroupConfig, DeckTemplate } from '../types/game';
import { BASE_SPELLS } from '../data/spells';
import { ConfirmationModal } from './ConfirmationModal';
import SaveTemplateModal from './SaveTemplateModal';
import { saveTemplate } from '../utils/storage';
import { encodeDeckConfig, decodeDeckConfig } from '../utils/shareUtils';

// ... (CategoryCard component remains same)

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

const CategoryCard = ({ 
    icon, 
    label, 
    count, 
    onClick,
    colorClass = "border-stone-500 bg-stone-800",
    isModified = false
}: { 
    icon: string; 
    label: string; 
    count?: number; 
    onClick?: () => void;
    colorClass?: string;
    isModified?: boolean;
}) => (
    <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center gap-3 cursor-pointer group relative"
    >
        <div className={`
            w-20 h-20 md:w-24 md:h-24 rounded-full border-4 
            ${colorClass}
            flex items-center justify-center text-4xl md:text-5xl 
            shadow-lg group-hover:shadow-xl group-hover:border-stone-300 transition-all
            relative
        `}>
            {icon}
            {count !== undefined && (
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-stone-900 border-2 border-stone-600 rounded-full flex items-center justify-center text-xs font-bold text-stone-300 shadow-md">
                    {count}
                </div>
            )}
            {isModified && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-rose-400 z-20 whitespace-nowrap">
                    NEW
                </div>
            )}
        </div>
        <span className="text-stone-400 font-bold uppercase tracking-widest text-xs group-hover:text-stone-200 transition-colors">
            {label}
        </span>
    </motion.div>
);

const DeckbuilderScreen = ({ onBack, onStartStandard, onStartCustom, initialTemplate }: DeckbuilderScreenProps) => {
    
    // Config State
    const [customPlayer, setCustomPlayer] = useState({ hp: 13, maxHp: 13, coins: 0 });
    const [customShields, setCustomShields] = useState<number[]>([2, 3, 4, 5, 6, 7]);
    const [customWeapons, setCustomWeapons] = useState<number[]>([2, 3, 4, 5, 6, 7]);
    const [customPotions, setCustomPotions] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [customCoins, setCustomCoins] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [customSpells, setCustomSpells] = useState<SpellType[]>([...BASE_SPELLS]);
    const [customMonsters, setCustomMonsters] = useState<MonsterGroupConfig[]>(DEFAULT_MONSTER_GROUPS);

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
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

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
        monsters: customMonsters
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
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full min-h-screen bg-stone-950 flex flex-col p-4 md:p-8 overflow-hidden font-sans select-none"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-sm">Назад</span>
                </button>
                
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-stone-200 uppercase tracking-tighter">
                        Deckbuilder
                    </h2>
                    <p className="text-stone-500 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mt-1">
                        {initialTemplate ? `Шаблон: ${initialTemplate.name}` : 'Конструктор колоды'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
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

                    <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1.5 rounded-lg border border-stone-800">
                        <span className="text-stone-500 text-xs font-bold uppercase">Всего карт</span>
                        <span className="text-stone-200 font-mono font-bold">{totalCards}</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto z-10 relative">
                <h3 className="text-stone-500 font-bold uppercase tracking-widest text-sm mb-12">Выберите категорию</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-12">
                     {/* Character */}
                    <CategoryCard 
                        icon="🧙‍♂️" 
                        label="Персонаж" 
                        colorClass="border-stone-400 bg-stone-800"
                        onClick={() => setShowCharacterEditor(true)}
                        isModified={isCharacterModified}
                    />

                    <CategoryCard 
                        icon="🐺" 
                        label="Монстры" 
                        count={monsterCount} 
                        colorClass="border-rose-500/50 bg-rose-900/20"
                        onClick={() => setShowMonstersEditor(true)}
                        isModified={isMonstersModified}
                    />
                    
                    {/* Weapons */}
                    <CategoryCard 
                        icon="⚔️" 
                        label="Оружие" 
                        count={customWeapons.length} 
                        colorClass="border-stone-400 bg-stone-800"
                        onClick={() => setShowWeaponsEditor(true)}
                        isModified={isWeaponsModified}
                    />

                    {/* Shields */}
                    <CategoryCard 
                        icon="🛡️" 
                        label="Щиты" 
                        count={customShields.length} 
                        colorClass="border-stone-400 bg-stone-800"
                        onClick={() => setShowShieldsEditor(true)}
                        isModified={isShieldsModified}
                    />

                    {/* Potions */}
                    <CategoryCard 
                        icon="🧪" 
                        label="Зелья" 
                        count={customPotions.length} 
                        colorClass="border-emerald-500/50 bg-emerald-900/20"
                        onClick={() => setShowPotionsEditor(true)}
                        isModified={isPotionsModified}
                    />
                    
                    {/* Coins */}
                    <CategoryCard 
                        icon="💎" 
                        label="Кристаллы" 
                        count={customCoins.length} 
                        colorClass="border-amber-500/50 bg-amber-900/20"
                        onClick={() => setShowCoinsEditor(true)}
                        isModified={isCoinsModified}
                    />

                    {/* Spells */}
                    <CategoryCard 
                        icon="📜" 
                        label="Заклинания" 
                        count={customSpells.length} 
                        colorClass="border-indigo-500/50 bg-indigo-900/20"
                        onClick={() => setShowSpellsEditor(true)}
                        isModified={isSpellsModified}
                    />
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-4 justify-center items-center mt-auto pt-8">
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
            </AnimatePresence>
        </motion.div>
    );
};

export default DeckbuilderScreen;
