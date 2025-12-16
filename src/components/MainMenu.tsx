import { motion, AnimatePresence } from 'framer-motion';
import { Play, PlusSquare, FileUp, BarChart3, Info, User as UserIcon, LogOut, Pencil, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DeckTemplate } from '../types/game';
import LoadTemplateModal from './LoadTemplateModal';
import { VersionModal } from './VersionModal';
import { AuthModal } from './AuthModal';
import { Chalkboard } from './Chalkboard';
import versionData from '../data/version_history.json';
import { useAuthStore } from '../stores/useAuthStore';

const QUOTES = [
    "Серега конечно красавчик, такой прототип запилил",
    "Это будет лучшая игра в мире",
    "Не забудь покормить кота перед рейдом",
    "Удача любит смелых (и тех, кто сохраняется)",
    "Скелеты тоже были когда-то искателями приключений",
    "Если долго смотреть в бездну, бездна попросит донат",
    "Главное не победа, а лут",
    "Зелье здоровья на вкус как вишневый сироп",
    "Осторожно, мимики повсюду!",
    "Этот код написан с любовью и кофе",
    "Враги не дремлют, но и мы не спим",
    "Каждый проигрыш делает тебя сильнее",
    "Собери колоду своей мечты",
    "Рандом суров, но справедлив (нет)",
    "Гоблины воруют носки, инфа 100%",
    "Магия вне Хогвартса запрещена, но здесь можно",
    "Хватит читать, иди играй!",
    "Где-то здесь спрятан секретный уровень (шутка)",
    "Программист не спал, чтобы ты играл",
    "Сделано в Skazmor Inc.",
    "Твой меч остер, но ум острее",
    "Не бойся темноты, бойся того, что в ней",
    "Золото само себя не заработает",
    "Легендарки падают только избранным",
    "Баги - это незадокументированные фичи",
    "Перерыв на чай повышает DPS",
    "Не кликай слишком быстро, мышка устанет",
    "Здесь могла быть ваша реклама",
    "Скоро релиз... наверное",
    "Playtest build: v0.0.1 (alpha)",
    "Спасибо, что играешь!",
    "Криты проходят чаще, если верить в себя",
    "Орк не тупой, орк сильный",
    "Эльфы не едят мясо, а зря",
    "Драконы любят золото и принцесс",
    "В подземелье сыро, надень шапку",
    "Факелы горят вечно, магия!",
    "Не нажимай Alt+F4, там нет читов",
    "Сохраняйся чаще, живи дольше",
    "Монстры тоже хотят обнимашек (но с ножом)",
    "Ты потрясающий!",
    "Уровень сложности: Жизнь",
    "Карты не врут",
    "Сила в единстве... и в хорошей колоде",
    "Не стой в огне!",
    "Танк не хилит, хил не танкует",
    "DD дамажит, все при деле",
    "Слава роботам! (шутка)",
    "Загрузка чувства юмора...",
    "Победа близко!",
    // New additions about Serega and Kirill
    "Серега снова затащил релиз!",
    "Кирилл сказал, что этот босс проходим (с 10-го раза)",
    "Если что-то работает, значит это Серега починил",
    "Геймдизайн от Кирилла — это чистое искусство (боли)",
    "Серега: пишет код, который пишет историю",
    "Баланс от Кирилла: страдать будут все поровну",
    "Памятник Сереге уже проектируется",
    "Кирилл придумал эту механику, пока пил кофе",
    "Серега не фиксит баги, он их изгоняет",
    "Если ты умер, это не баг, это геймдизайн Кирилла",
    "Код Сереги можно читать как поэзию",
    "Кирилл балансирует игру одной левой (правой пьет чай)",
    "Серега сказал 'надо', код ответил 'есть'",
    "Кирилл добрый, он оставил тебе целых 1 HP",
    "У Сереги нет undefined, у него всё определено",
    "Кирилл знает, о чем думает игрок, и это пугает",
    "Серега — MVP этого проекта (и всех остальных)",
    "Кирилл: 'Я не злодей, я просто люблю хардкор'",
    "Когда Серега коммитит, серверы аплодируют",
    "Геймдизайн Кирилла заставляет плакать от счастья (и боли)",
    "Серега — повелитель Реакта и тайпскрипта",
    "Кирилл не просто придумывает правила, он их создает",
    "Архитектура от Сереги — надежнее швейцарских часов",
    "Кирилл сказал 'так будет веселее', и стало сложнее",
    "Серега не спит, он оптимизирует процессы во сне",
    "Если тебе сложно, значит Кирилл всё сделал правильно",
    "Слава роботам и слава Сереге!",
    "Кирилл считает, что легкая игра — это скучная игра",
    "Серега — это знак качества",
    "Кирилл и Серега — дримтим, каких поискать"
];

interface MainMenuProps {
  onStartGame: () => void;
  onCreateGame: () => void;
  onShowStats: () => void;
  onLoadTemplate: (template: DeckTemplate) => void;
}

const MainMenu = ({ onStartGame, onCreateGame, onShowStats, onLoadTemplate }: MainMenuProps) => {
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  // Easter Egg State
  const [skullClickCount, setSkullClickCount] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [chalkColor, setChalkColor] = useState('#e7e5e4'); // Default Stone-200 (White-ish)
  
  // Chaos Mode State
  const [chaosMode, setChaosMode] = useState(false);
  const [warningMode, setWarningMode] = useState(false);
  const globalClickCount = useRef(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  // Global click listener for Chaos Mode
  useEffect(() => {
    const handleGlobalClick = () => {
        globalClickCount.current += 1;
        
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
        
        // Reset count if no click for 1 second
        clickTimeout.current = setTimeout(() => {
            globalClickCount.current = 0;
        }, 1000);

        if (globalClickCount.current >= 15 && !chaosMode && !warningMode) {
            triggerChaos();
            globalClickCount.current = 0;
        }
    };

    window.addEventListener('pointerdown', handleGlobalClick);
    return () => {
        window.removeEventListener('pointerdown', handleGlobalClick);
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, [chaosMode, warningMode]);

  const triggerChaos = () => {
      setChaosMode(true);
      
      // Stop chaos after 5 seconds
      setTimeout(() => {
          setChaosMode(false);
          setWarningMode(true);
          
          // Hide warning after 5 seconds (was 3)
          setTimeout(() => {
              setWarningMode(false);
          }, 5000);
      }, 5000);
  };

  const CHALK_COLORS = [
      { color: '#e7e5e4', name: 'White' },   // stone-200
      { color: '#fca5a5', name: 'Red' },     // red-300
      { color: '#fde047', name: 'Yellow' },  // yellow-300
      { color: '#93c5fd', name: 'Blue' },    // blue-300
      { color: '#86efac', name: 'Green' },   // green-300
      { color: '#d8b4fe', name: 'Purple' },  // purple-300
      { color: '#fdba74', name: 'Orange' },  // orange-300
  ];

  const handleSkullClick = () => {
      const newCount = skullClickCount + 1;
      setSkullClickCount(newCount);
      if (newCount >= 5) {
          setShowColorPicker(true);
          setSkullClickCount(0);
      }
  };

  const { user, initializeAuth, signOut } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  // Stickers Configuration
  const [stickers] = useState(() => {
      const side1 = Math.random() > 0.5 ? 'left' : 'right';
      const side2 = side1 === 'left' ? 'right' : 'left';

      const getStyle = (side: 'left' | 'right') => ({
          top: `${10 + Math.random() * 50}%`,
          left: side === 'left' ? `${3 + Math.random() * 12}%` : undefined,
          right: side === 'right' ? `${3 + Math.random() * 12}%` : undefined,
          rotate: -15 + Math.random() * 30
      });

      return [
          { 
            ...getStyle(side1), 
            src: '/images/IMG_0051.png', 
            id: 'img1', 
            caption: 'Ну это же красиво, правда',
            extra: '/images/IMG_3088_1.png' 
          },
          { ...getStyle(side2), src: '/images/IMG_0010.png', id: 'img2', caption: 'Мы точно релизнемся когда-нибудь' }
      ];
  });
  
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const selectedSticker = stickers.find(s => s.id === selectedStickerId);

  useEffect(() => {
    const interval = setInterval(() => {
        setQuoteIndex(prev => {
            let next;
            do {
                next = Math.floor(Math.random() * QUOTES.length);
            } while (next === prev && QUOTES.length > 1);
            return next;
        });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-screen bg-stone-950 flex flex-col items-center justify-center p-4 overflow-hidden"
    >
      {/* Warning Overlay (Fullscreen) */}
      <AnimatePresence>
        {warningMode && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
            >
                {/* Comic Background Rays - REMOVED per request */}
                {/* <div className="absolute inset-0 opacity-20 pointer-events-none">...</div> */}

                <motion.div
                    key="warning"
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.5, rotate: 10 }}
                    className="relative flex flex-col items-center justify-center z-50 pointer-events-none select-none"
                >
                    {/* Dizzy Emoji with Stars Halo */}
                    <div className="relative mb-6">
                        <motion.div 
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-8xl filter drop-shadow-2xl"
                        >
                            😵‍💫
                        </motion.div>
                        
                        {/* 3D Halo of Stars */}
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-10"
                            style={{ transformStyle: 'preserve-3d', perspective: '100px' }}
                        >
                             {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="absolute text-yellow-400 text-4xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                    style={{ 
                                        left: '50%',
                                        top: '50%',
                                        transform: `rotateY(${i * 72}deg) translateZ(60px)`,
                                    }}
                                >
                                    ⭐
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* 3D Comic Text - Poster Layout */}
                    <div className="flex flex-col items-center relative z-10">
                        <motion.span 
                            animate={{ scale: [1, 1.1, 1], rotate: [-15, -20, -15] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                            className="text-6xl md:text-7xl font-black text-white italic tracking-tighter absolute -top-16 -left-24 z-20"
                            style={{ 
                                textShadow: '4px 4px 0px #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
                                fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif'
                            }}
                        >
                            УФФ...
                        </motion.span>
                        
                        <div className="relative">
                            <motion.span 
                                className="block text-5xl md:text-6xl font-extrabold text-yellow-400 tracking-wider uppercase transform -rotate-6 z-30 relative"
                                style={{ 
                                    textShadow: '3px 3px 0px #ea580c, 6px 6px 0px #000',
                                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif'
                                }}
                            >
                                НЕ ДЕЛАЙ ТАК
                            </motion.span>
                            
                            <motion.span 
                                initial={{ scale: 0.8 }}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.3, repeat: Infinity }}
                                className="block text-8xl md:text-[10rem] font-black text-rose-600 tracking-tighter uppercase leading-[0.7] transform rotate-3 mt-[-20px] relative z-20"
                                style={{ 
                                    textShadow: '6px 6px 0px #500724, 12px 12px 0px #000, 0 0 30px rgba(225,29,72,0.6)',
                                    WebkitTextStroke: '4px white',
                                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif'
                                }}
                            >
                                БОЛЬШЕ!
                            </motion.span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Chaos Glitch Overlay */}
      {chaosMode && (
          <>
            <div className="absolute inset-0 z-50 pointer-events-none mix-blend-color-dodge bg-red-500/10 animate-pulse"></div>
            <div className="absolute inset-0 z-50 pointer-events-none mix-blend-exclusion bg-blue-500/10 animate-bounce" style={{ animationDuration: '0.1s' }}></div>
          </>
      )}

      {/* Chalkboard Background */}
      <div className={`transition-all duration-100 ${chaosMode ? 'blur-sm scale-110 contrast-150 saturate-200' : ''}`}>
        <Chalkboard color={chalkColor} />
      </div>

      {/* Фоновый шум/текстура */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

      {/* Логотип */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={chaosMode ? { 
            x: [0, -20, 20, -10, 10, 0], 
            y: [0, 10, -10, 5, -5, 0],
            rotate: [0, -5, 5, -3, 3, 0],
            filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(180deg)", "hue-rotate(0deg)"],
            scale: [1, 1.1, 0.9, 1.2, 1]
        } : { y: 0, opacity: 1, x: 0, rotate: 0, scale: 1, filter: "none" }}
        transition={chaosMode ? { duration: 0.2, repeat: Infinity } : { duration: 0.8, ease: "easeOut" }}
        className="mb-12 text-center z-10 relative"
      >
        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-4 transition-opacity duration-300 ${chaosMode || warningMode ? 'opacity-0' : 'opacity-100'}`}>
             {/* Auth Button / User Profile */}
             <AnimatePresence mode="wait">
                {user ? (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 bg-stone-900/80 backdrop-blur-md border border-stone-800 rounded-full pl-1 pr-4 py-1"
                    >
                        <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xl shadow-inner border border-stone-700">
                            {['Bjorn', 'Wolf', 'Bear', 'Fox', 'Owl'][Math.abs(user.email?.length || 0) % 5] === 'Bjorn' ? '🐻' : 
                             ['Bjorn', 'Wolf', 'Bear', 'Fox', 'Owl'][Math.abs(user.email?.length || 0) % 5] === 'Wolf' ? '🐺' :
                             ['Bjorn', 'Wolf', 'Bear', 'Fox', 'Owl'][Math.abs(user.email?.length || 0) % 5] === 'Bear' ? '🐼' :
                             ['Bjorn', 'Wolf', 'Bear', 'Fox', 'Owl'][Math.abs(user.email?.length || 0) % 5] === 'Fox' ? '🦊' : '🦉'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-none mb-0.5">Player</span>
                            <span className="text-xs text-stone-300 font-mono leading-none max-w-[100px] truncate" title={user.email}>
                                {user.email?.split('@')[0]}
                            </span>
                        </div>
                        <button 
                            onClick={() => signOut()}
                            className="ml-2 p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-full transition-colors"
                            title="Выйти"
                        >
                            <LogOut size={14} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => setShowAuthModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-stone-900/80 backdrop-blur-md border border-stone-800 hover:border-emerald-500/50 text-stone-400 hover:text-emerald-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
                    >
                        <UserIcon size={14} />
                        Войти
                    </motion.button>
                )}
             </AnimatePresence>
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-bold text-stone-200 tracking-tighter uppercase drop-shadow-xl relative inline-flex items-center">
          <motion.span
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
          >
              Skazmor
          </motion.span>
          
          {/* Version Badge */}
          {!chaosMode && !warningMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVersionHistory(true)}
            className="absolute -top-6 -right-16 md:-right-20 bg-stone-800/80 border border-stone-700 hover:border-emerald-500/50 backdrop-blur-sm px-2 py-1 rounded text-[10px] md:text-xs font-mono tracking-widest text-stone-400 hover:text-emerald-400 flex items-center gap-1 transition-all shadow-lg cursor-pointer z-50"
          >
            <Info size={10} />
            v{versionData.version}
          </motion.button>
          )}
        </h1>
        <p className={`text-stone-500 text-sm tracking-[0.5em] mt-2 uppercase transition-opacity duration-300 ${chaosMode || warningMode ? 'opacity-0' : 'opacity-100'}`}>Roguelike Deckbuilder</p>
      </motion.div>

      {/* Основные кнопки */}
      <div className="flex flex-col gap-4 w-full max-w-xs z-10">
        <MenuButton 
          icon={<Play size={20} />} 
          label="Играть" 
          delay={0.2} 
          primary 
          onClick={onStartGame}
          chaos={chaosMode} // Pass chaos prop
        />
        <MenuButton 
            icon={<PlusSquare size={20} />} 
            label="Создать игру" 
            delay={0.3} 
            onClick={onCreateGame}
            chaos={chaosMode}
        />
        <MenuButton 
            icon={<FileUp size={20} />} 
            label="Загрузить шаблон" 
            delay={0.4} 
            onClick={() => setShowLoadTemplate(true)}
            chaos={chaosMode}
        />
        <MenuButton 
            icon={<BarChart3 size={20} />} 
            label="Статистика забегов" 
            delay={0.5} 
            onClick={onShowStats}
            chaos={chaosMode}
        />
      </div>
      
       {/* Эмодзи декор */}
       <div className="absolute top-1/4 left-10 text-8xl opacity-5 rotate-12 select-none pointer-events-none">🗡️</div>
       <div 
            className="absolute bottom-1/4 right-10 text-8xl opacity-5 -rotate-12 select-none cursor-pointer hover:opacity-10 transition-opacity z-20"
            onClick={handleSkullClick}
       >
        💀
       </div>

       {/* Color Picker Easter Egg */}
       <AnimatePresence>
            {showColorPicker && (
                <motion.div
                    drag
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.9, x: '-50%', y: 20 }}
                    animate={{ opacity: 1, scale: 1, x: '-50%', y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{ position: 'absolute', top: '75%', left: '50%' }} // Initial position lower
                    onPointerDown={(e) => e.stopPropagation()} // Stop drawing when interacting with panel
                    className="z-50 flex items-center gap-2 bg-stone-900/90 backdrop-blur border border-stone-800 p-2 rounded-xl shadow-2xl cursor-move"
                >
                    {CHALK_COLORS.map((c) => (
                        <button
                            key={c.color}
                            onClick={() => setChalkColor(c.color)}
                            // No need for stopPropagation here if parent handles it, but safer to keep or remove if parent works.
                            // Parent onPointerDown handles the drag start blocking drawing.
                            className={`p-2 rounded-lg transition-transform hover:scale-110 ${chalkColor === c.color ? 'bg-stone-800 ring-1 ring-stone-600' : ''}`}
                            title={c.name}
                        >
                            <Pencil 
                                size={20} 
                                color={c.color} 
                                fill={c.color} 
                                className="drop-shadow-sm"
                            />
                        </button>
                    ))}
                    <div className="w-px h-6 bg-stone-700 mx-1" />
                    <button
                        onClick={() => {
                            setShowColorPicker(false);
                            setChalkColor('#e7e5e4'); // Reset to white
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-2 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            )}
       </AnimatePresence>

       {/* Random Sticker Images */}
       {stickers.map((sticker, i) => (
           <motion.div
                key={sticker.id}
                initial={{ opacity: 0, scale: 1, rotate: sticker.rotate }}
                animate={chaosMode ? {
                    x: [0, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500],
                    y: [0, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500],
                    rotate: [sticker.rotate, sticker.rotate + 180, sticker.rotate - 180],
                    scale: [1, 1.5, 0.5],
                    filter: ["none", "invert(100%)", "hue-rotate(180deg)", "none"]
                } : { 
                    opacity: 1, 
                    scale: 1, 
                    rotate: sticker.rotate,
                    x: 0,
                    y: 0,
                    filter: "none"
                }}
                transition={chaosMode ? { 
                    duration: 0.1, 
                    repeat: Infinity, 
                    repeatType: "mirror", 
                    ease: "linear" 
                } : { duration: 0.4, ease: "backOut" }}
                className="absolute z-0 hidden md:block"
                style={{ 
                    top: sticker.top, 
                    left: sticker.left, 
                    right: sticker.right,
                    width: '220px',
                    transformOrigin: 'top center'
                }}
           >
                {/* Attached Mini Photo (Underneath) */}
                {(sticker as any).extra && (
                    <div className="absolute -bottom-24 -left-8 w-36 h-auto -rotate-12 -z-10 pointer-events-none">
                            <img 
                                src={(sticker as any).extra} 
                                alt="Extra"
                                className="w-full h-auto block drop-shadow-lg filter brightness-105"
                            />
                    </div>
                )}

                {/* Photo Frame */}
                <motion.div 
                    layoutId={`sticker-${sticker.id}`}
                    onClick={() => setSelectedStickerId(sticker.id)}
                    whileHover={{ 
                        scale: 1.1, 
                        rotate: (i % 2 === 0 ? 3 : -3),
                        zIndex: 50
                    }}
                    className="group bg-stone-200 p-3 pb-10 shadow-[0_15px_30px_rgba(0,0,0,0.3)] rotate-1 transform-gpu relative cursor-pointer will-change-transform"
                >
                    {/* Tape */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-7 bg-white/30 backdrop-blur-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] -rotate-1 z-20 pointer-events-none"></div>

                    <img 
                        src={sticker.src}
                        alt="Memorable moment" 
                        className="w-full h-auto grayscale contrast-110 border border-stone-300/50 relative z-10 pointer-events-none transition-all duration-500 ease-out group-hover:grayscale-0"
                    />
                </motion.div>
           </motion.div>
       ))}

       {/* Fullscreen Image Overlay */}
       <AnimatePresence>
           {selectedSticker && (
               <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.2 }}
                   className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
                   onClick={() => setSelectedStickerId(null)}
               >
                   <motion.div
                       layoutId={`sticker-${selectedSticker.id}`}
                       className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center will-change-transform cursor-zoom-out"
                       onClick={() => setSelectedStickerId(null)} 
                       transition={{ type: "spring", stiffness: 250, damping: 25 }}
                       style={{ rotate: 0 }}
                   >
                        {/* Enlarged Photo Frame */}
                        <div className="bg-stone-200 p-4 pb-20 shadow-2xl transform-gpu relative max-h-[85vh] w-auto inline-block">
                            <img 
                                src={selectedSticker.src}
                                alt="Full size" 
                                className="w-auto h-auto max-h-[75vh] min-w-[300px] object-contain grayscale-[0.1] contrast-110 border border-stone-300/50"
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-6 left-0 right-0 text-center px-4"
                            >
                                <span className="font-handwriting font-serif italic text-2xl md:text-3xl text-stone-800 opacity-90">
                                    {selectedSticker.caption}
                                </span>
                            </motion.div>
                        </div>
                   </motion.div>
               </motion.div>
           )}
       </AnimatePresence>

       <AnimatePresence>
           {showLoadTemplate && (
               <LoadTemplateModal 
                   onLoad={(template) => {
                       onLoadTemplate(template);
                       setShowLoadTemplate(false);
                   }}
                   onClose={() => setShowLoadTemplate(false)}
               />
           )}
           {showVersionHistory && (
               <VersionModal onClose={() => setShowVersionHistory(false)} />
           )}
           {showAuthModal && (
               <AuthModal onClose={() => setShowAuthModal(false)} />
           )}
       </AnimatePresence>

       {/* Footer Quotes */}
       <div className="absolute bottom-6 w-full text-center px-4 z-20 pointer-events-none">
           <AnimatePresence mode="wait">
               <motion.p
                 key={quoteIndex}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.5 }}
                 className="text-stone-600/60 text-xs md:text-sm italic font-serif select-none"
               >
                   {QUOTES[quoteIndex]}
               </motion.p>
           </AnimatePresence>
       </div>
    </motion.div>
  );
};

// Helper for random glitch transform
const getRandomGlitch = () => {
    const rX = (Math.random() - 0.5) * 20;
    const rY = (Math.random() - 0.5) * 20;
    return `translate(${rX}px, ${rY}px)`;
};

// Компонент одной кнопки меню
const MenuButton = ({ icon, label, delay, primary = false, small = false, chaos = false, onClick }: { icon: React.ReactNode, label: string, delay: number, primary?: boolean, small?: boolean, chaos?: boolean, onClick?: () => void }) => {
  // Generate consistent random values for chaos effect trajectory
  const randomX = (Math.random() - 0.5) * 800; 
  const randomY = (Math.random() - 0.5) * 600; 
  const randomRotate = (Math.random() - 0.5) * 180;

  return (
    <motion.button
      onClick={onClick}
      initial={{ x: -20, opacity: 0 }}
      animate={chaos ? { 
          x: [0, randomX, randomX + 50, randomX - 50, randomX], 
          y: [0, randomY, randomY + 50, randomY - 50, randomY],
          rotate: [0, randomRotate, randomRotate + 10, randomRotate - 10, randomRotate],
          scale: [1, 0.8, 1.1, 0.9, 0.8],
          opacity: [1, 0.8, 1, 0.5, 0.8],
          filter: [
              "none", 
              "hue-rotate(90deg) contrast(200%)", 
              "hue-rotate(180deg) invert(100%)", 
              "blur(2px) hue-rotate(45deg)", 
              "none"
          ]
      } : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, filter: "none" }}
      whileHover={!chaos ? { scale: 1.02 } : {}}
      whileTap={!chaos ? { scale: 0.98 } : {}}
      transition={chaos ? { 
          duration: 0.1, // Fast updates
          repeat: Infinity, 
          repeatType: "mirror",
          ease: "linear" // Use standard easing, the jaggedness comes from keyframes and speed
      } : { 
          // Instant return if coming back from chaos, else normal spring
          duration: 0.1, // Snap back instantly
          type: "tween",
          ease: "circOut"
      }}
      className={`
        relative group flex items-center justify-center gap-3 w-full 
        ${small ? 'py-3 text-sm' : 'py-4 text-lg'}
        font-medium tracking-wide rounded-xl border transition-all duration-200 cursor-pointer
        ${primary 
          ? 'bg-stone-100 text-stone-950 border-stone-100 shadow-lg shadow-stone-900/50' 
          : 'bg-stone-900/50 text-stone-300 border-stone-800 hover:bg-stone-800 hover:border-stone-600 hover:text-white'}
        ${chaos ? 'shadow-[5px_0_0_rgba(255,0,0,0.5),-5px_0_0_rgba(0,255,255,0.5)]' : ''}
      `}
    >
      {icon}
      {label}
    </motion.button>
  );
};

export default MainMenu;
