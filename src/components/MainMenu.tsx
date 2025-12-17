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

// Funny recovery logs (Russian)
const RECOVERY_LOGS = [
    "Анализ когнитивных способностей пользователя... ОШИБКА: Логика не найдена.",
    "Подкуп видеокарты виртуальными печеньками...",
    "Удаление папки 'System32'... (Шутка, наверное)",
    "Призыв духа машины...",
    "Выравнивание пиксельных матриц...",
    "Скачивание дополнительной оперативной памяти...",
    "Попытка выключить и включить снова...",
    "Обнаружен критический уровень сарказма.",
    "Компиляция спагетти-кода...",
    "Кормление хомяка внутри сервера...",
    "Вычисление смысла жизни... 42.",
    "Латание четвертой стены...",
    "Запрос помощи у ИИ... ИИ смеется.",
    "Восстановление резервной копии рассудка...",
    "Оптимизация параметров веселья...",
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
  
  // Chaos Mode State Machine
  const [chaosStage, setChaosStage] = useState<'idle' | 'glitch' | 'crash' | 'console' | 'success'>('idle');
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Screensaver State
  const [showScreensaver, setShowScreensaver] = useState(false);
  const idleTimeRef = useRef(0);
  const screensaverRef = useRef<HTMLDivElement>(null);
  const logoPos = useRef({ x: 100, y: 100 });
  const logoVel = useRef({ x: 2, y: 2 });
  const [logoColor, setLogoColor] = useState('#ef4444'); // Default red
  
  const globalClickCount = useRef(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  // Inactivity Tracker
  useEffect(() => {
    const resetIdle = () => {
        idleTimeRef.current = 0;
        if (showScreensaver) {
            setShowScreensaver(false);
        }
    };

    const events = ['pointermove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetIdle));

    const interval = setInterval(() => {
        idleTimeRef.current += 1;
        if (idleTimeRef.current >= 30 && !showScreensaver) {
            setShowScreensaver(true);
            // Random start pos
            logoPos.current = { 
                x: Math.random() * (window.innerWidth - 200), 
                y: Math.random() * (window.innerHeight - 100) 
            };
        }
    }, 1000);

    return () => {
        events.forEach(e => window.removeEventListener(e, resetIdle));
        clearInterval(interval);
    };
  }, [showScreensaver]);

  // Screensaver Animation Loop
  useEffect(() => {
      if (!showScreensaver) return;

      let rafId: number;
      const animate = () => {
          if (!screensaverRef.current) return;
          
          const { x, y } = logoPos.current;
          const { x: vx, y: vy } = logoVel.current;
          const width = 200; // Approx logo width
          const height = 80; // Approx logo height
          const screenW = window.innerWidth;
          const screenH = window.innerHeight;

          let newX = x + vx;
          let newY = y + vy;
          let bounced = false;

          // Bounce X
          if (newX <= 0 || newX + width >= screenW) {
              logoVel.current.x *= -1;
              newX = Math.max(0, Math.min(newX, screenW - width));
              bounced = true;
          }

          // Bounce Y
          if (newY <= 0 || newY + height >= screenH) {
              logoVel.current.y *= -1;
              newY = Math.max(0, Math.min(newY, screenH - height));
              bounced = true;
          }

          if (bounced) {
              const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316'];
              setLogoColor(colors[Math.floor(Math.random() * colors.length)]);
          }

          logoPos.current = { x: newX, y: newY };
          
          // Direct DOM manipulation for performance
          const logoEl = screensaverRef.current.querySelector('#dvd-logo') as HTMLElement;
          if (logoEl) {
              logoEl.style.transform = `translate(${newX}px, ${newY}px)`;
          }

          rafId = requestAnimationFrame(animate);
      };

      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
  }, [showScreensaver]);

  // Auto-scroll console
  useEffect(() => {
      if (chaosStage === 'console' || chaosStage === 'success') {
          consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
  }, [consoleLogs, chaosStage]);

  // Global click listener for Chaos Mode
  useEffect(() => {
    const handleGlobalClick = () => {
        if (chaosStage !== 'idle') return; // Ignore clicks if already in chaos

        globalClickCount.current += 1;
        
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
        
        // Reset count if no click for 1 second
        clickTimeout.current = setTimeout(() => {
            globalClickCount.current = 0;
        }, 1000);

        if (globalClickCount.current >= 15) {
            setChaosStage('glitch');
            globalClickCount.current = 0;
        }
    };

    window.addEventListener('pointerdown', handleGlobalClick);
    return () => {
        window.removeEventListener('pointerdown', handleGlobalClick);
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, [chaosStage]);

  // Chaos Sequence Logic
  useEffect(() => {
      if (chaosStage === 'glitch') {
          // 1. Glitch Phase -> Auto transition to Crash after 3s
          const timer = setTimeout(() => {
              setChaosStage('crash');
          }, 3000);
          return () => clearTimeout(timer);
      } 
      else if (chaosStage === 'console') {
          // 3. Console Phase -> Add logs and progress
          setConsoleLogs([]);
          setRecoveryProgress(0);
          
          let logIndex = 0;
          const totalDuration = 20000; // Increased to 20 seconds (was 15s)
          
          // Log adder - slower
          const logInterval = setInterval(() => {
              if (logIndex < RECOVERY_LOGS.length) {
                  setConsoleLogs(prev => [...prev, RECOVERY_LOGS[logIndex]]);
                  logIndex++;
              }
          }, 1200); // Slower logs (was 800ms)

          // Progress Bar (smoother and slower)
          const startTime = Date.now();
          const progressInterval = setInterval(() => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(100, (elapsed / totalDuration) * 100);
              setRecoveryProgress(progress);
              
              if (progress >= 100) {
                  clearInterval(progressInterval);
                  clearInterval(logInterval);
                  // Transition to success phase directly
                  setChaosStage('success');
              }
          }, 50);

          return () => {
              clearInterval(logInterval);
              clearInterval(progressInterval);
          };
      }
  }, [chaosStage]);

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
      {/* --- CHAOS OVERLAYS --- */}
      <AnimatePresence>
        {/* 1. GLITCH PHASE OVERLAY - SCI-FI STYLE */}
        {chaosStage === 'glitch' && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] pointer-events-none overflow-hidden"
            >
                {/* CRT Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
                
                {/* Moving Glitch Bars */}
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay animate-pulse"></div>
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute h-2 w-full bg-white/20 mix-blend-difference"
                        animate={{ 
                            top: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                            opacity: [0, 1, 0]
                        }}
                        transition={{ 
                            duration: 0.1 + Math.random() * 0.2, 
                            repeat: Infinity,
                            repeatType: "mirror" 
                        }}
                    />
                ))}
                
                {/* Color Split Effect */}
                <div className="absolute inset-0 mix-blend-screen bg-red-500/10 animate-[ping_0.1s_linear_infinite] translate-x-1"></div>
                <div className="absolute inset-0 mix-blend-screen bg-blue-500/10 animate-[ping_0.1s_linear_infinite_reverse] -translate-x-1"></div>
            </motion.div>
        )}

        {/* 2. CRASH SCREEN (BSOD/Red Screen) - STYLIZED MODAL */}
        {chaosStage === 'crash' && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
            >
                <div className="max-w-xl w-full bg-stone-950 border border-red-900/50 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.2)] p-8 relative overflow-hidden">
                    {/* Decorative header line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"></div>
                    
                    <div className="flex items-center gap-3 mb-6 text-red-500">
                         <div className="p-2 bg-red-500/10 rounded-lg animate-pulse">
                            <span className="text-2xl">⚠️</span>
                         </div>
                         <h1 className="text-2xl font-bold tracking-wider uppercase">Системный Сбой</h1>
                    </div>

                    <div className="space-y-4 font-mono text-sm text-stone-400 mb-8 border-l-2 border-red-500/20 pl-4">
                        <p className="text-red-400 font-bold">КРИТИЧЕСКАЯ ОШИБКА: 0xDEADBEEF</p>
                        <p>Фатальное исключение по адресу 0028:C0011E36.</p>
                        <p>Целостность данных нарушена.</p>
                        <p className="opacity-70">Инициализация протокола аварийного восстановления...</p>
                    </div>

                    <button 
                        onClick={() => setChaosStage('console')}
                        className="w-full bg-red-900/20 hover:bg-red-900/30 text-red-200 hover:text-white border border-red-900/50 hover:border-red-500 transition-all py-4 rounded-lg font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
                    >
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Запустить Восстановление
                    </button>
                </div>
            </motion.div>
        )}

        {/* 3. RECOVERY CONSOLE (Combined Console & Success) */}
        {(chaosStage === 'console' || chaosStage === 'success') && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/50 backdrop-blur-sm"
            >
                <div className="w-full max-w-4xl bg-stone-950/95 border border-stone-700 rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-green-500 h-[80vh]">
                    {/* Terminal Header */}
                    <div className="bg-stone-900 border-b border-stone-800 p-3 flex items-center gap-4 select-none">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="flex-1 text-center text-xs text-stone-500 font-bold tracking-widest uppercase">
                            SKAZMOR SYSTEM RECOVERY TOOL v1.0
                        </div>
                        <div className="w-10"></div> {/* Spacer for center alignment */}
                    </div>

                    {/* Terminal Body */}
                    <div className="flex-1 p-6 overflow-y-auto scrollbar-hide font-mono text-sm md:text-lg leading-relaxed relative">
                        <div className="flex flex-col gap-2">
                            {consoleLogs.map((log, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="opacity-90"
                                >
                                    <span className="text-green-700 mr-3 select-none">{`>`}</span>
                                    {log}
                                </motion.div>
                            ))}
                            <div ref={consoleEndRef} />
                            
                            {chaosStage === 'console' && (
                                <motion.div 
                                    animate={{ opacity: [0, 1] }} 
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                    className="text-green-500 font-bold mt-2"
                                >_</motion.div>
                            )}

                            {/* Success Message inside Terminal */}
                            {chaosStage === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-8 border-t border-green-900/50 pt-8"
                                >
                                    <div className="text-green-400 font-bold mb-4">
                                        === SYSTEM RESTORED SUCCESSFULLY ===
                                    </div>
                                    <div className="text-yellow-500 mb-8">
                                        <span className="text-red-500 font-bold mr-2">[WARNING]</span>
                                        Обнаружена аномалия в поведении пользователя.
                                        <br/>
                                        НЕ ДЕЛАЙТЕ ТАК БОЛЬШЕ.
                                        <br/>
                                        В следующий раз восстановление может быть невозможным.
                                    </div>
                                    
                                    <button 
                                        onClick={() => setChaosStage('idle')}
                                        className="group flex items-center gap-2 text-stone-300 hover:text-green-400 transition-colors uppercase tracking-widest text-sm font-bold animate-pulse"
                                    >
                                        <span className="text-green-600 group-hover:text-green-400">{`>>`}</span>
                                        [ ПЕРЕЗАГРУЗИТЬ СИСТЕМУ ]
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                    
                    {/* Progress Bar (Only during console phase) */}
                    {chaosStage === 'console' && (
                        <div className="p-4 bg-stone-900/50 border-t border-stone-800">
                            <div className="text-xs text-stone-500 mb-1 flex justify-between">
                                <span>STATUS: RECOVERING...</span>
                                <span>{Math.round(recoveryProgress)}%</span>
                            </div>
                            <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                    style={{ width: `${recoveryProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Chalkboard Background */}
      <div className={`transition-all duration-100 ${chaosStage === 'glitch' ? 'blur-sm scale-110 contrast-150 saturate-200' : ''}`}>
        <Chalkboard color={chalkColor} />
      </div>

      {/* Фоновый шум/текстура */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

      {/* Логотип */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-12 text-center z-10 relative"
      >
        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-4 transition-opacity duration-300 ${chaosStage !== 'idle' ? 'opacity-0' : 'opacity-100'}`}>
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
          {chaosStage === 'idle' && (
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
        <p className={`text-stone-500 text-sm tracking-[0.5em] mt-2 uppercase transition-opacity duration-300 ${chaosStage !== 'idle' ? 'opacity-0' : 'opacity-100'}`}>Roguelike Deckbuilder</p>
      </motion.div>

      {/* Основные кнопки */}
      <div className="flex flex-col gap-4 w-full max-w-xs z-10">
        <MenuButton 
          icon={<Play size={20} />} 
          label="Играть" 
          delay={0.2} 
          primary 
          onClick={onStartGame}
        />
        <MenuButton 
            icon={<PlusSquare size={20} />} 
            label="Создать игру" 
            delay={0.3} 
            onClick={onCreateGame}
        />
        <MenuButton 
            icon={<FileUp size={20} />} 
            label="Загрузить шаблон" 
            delay={0.4} 
            onClick={() => setShowLoadTemplate(true)}
        />
        <MenuButton 
            icon={<BarChart3 size={20} />} 
            label="Статистика забегов" 
            delay={0.5} 
            onClick={onShowStats}
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
                animate={{ opacity: 1, scale: 1, rotate: sticker.rotate }}
                transition={{ duration: 0.4, ease: "backOut" }}
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

       {/* SCREENSAVER OVERLAY */}
       <AnimatePresence>
            {showScreensaver && (
                <motion.div
                    ref={screensaverRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    transition={{ duration: 1 }}
                    className="fixed inset-0 z-[300] bg-black cursor-none overflow-hidden"
                >
                    <div 
                        id="dvd-logo"
                        className="absolute will-change-transform"
                        style={{ width: '200px', height: '80px', color: logoColor }}
                    >
                         <h1 className="text-4xl font-display font-bold tracking-tighter uppercase drop-shadow-[0_0_15px_currentColor]">
                             Skazmor
                         </h1>
                         <p className="text-xs tracking-[0.5em] opacity-80 uppercase">ROGUELIKE DECKBUILDER</p>
                    </div>
                </motion.div>
            )}
       </AnimatePresence>
    </motion.div>
  );
};

// Компонент одной кнопки меню
const MenuButton = ({ icon, label, delay, primary = false, small = false, onClick }: { icon: React.ReactNode, label: string, delay: number, primary?: boolean, small?: boolean, onClick?: () => void }) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: delay, type: "spring", stiffness: 300, damping: 20 }}
      className={`
        relative group flex items-center justify-center gap-3 w-full 
        ${small ? 'py-3 text-sm' : 'py-4 text-lg'}
        font-medium tracking-wide rounded-xl border transition-all duration-200 cursor-pointer
        ${primary 
          ? 'bg-stone-100 text-stone-950 border-stone-100 shadow-lg shadow-stone-900/50' 
          : 'bg-stone-900/50 text-stone-300 border-stone-800 hover:bg-stone-800 hover:border-stone-600 hover:text-white'}
      `}
    >
      {icon}
      {label}
    </motion.button>
  );
};

export default MainMenu;
