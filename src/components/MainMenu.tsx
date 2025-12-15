import { motion, AnimatePresence } from 'framer-motion';
import { Play, PlusSquare, FileUp, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DeckTemplate } from '../types/game';
import LoadTemplateModal from './LoadTemplateModal';

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
  const [quoteIndex, setQuoteIndex] = useState(0);

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
      {/* Фоновый шум/текстура */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* Логотип */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-12 text-center z-10"
      >
        <h1 className="text-6xl md:text-8xl font-display font-bold text-stone-200 tracking-tighter uppercase drop-shadow-xl">
          Skazmor
        </h1>
        <p className="text-stone-500 text-sm tracking-[0.5em] mt-2 uppercase">Roguelike Deckbuilder</p>
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
       <div className="absolute bottom-1/4 right-10 text-8xl opacity-5 -rotate-12 select-none pointer-events-none">💀</div>

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
