import { motion, AnimatePresence } from 'framer-motion';
import { Play, PlusSquare, FileUp, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { DeckTemplate } from '../types/game';
import LoadTemplateModal from './LoadTemplateModal';

interface MainMenuProps {
  onStartGame: () => void;
  onCreateGame: () => void;
  onShowStats: () => void;
  onLoadTemplate: (template: DeckTemplate) => void;
}

const MainMenu = ({ onStartGame, onCreateGame, onShowStats, onLoadTemplate }: MainMenuProps) => {
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);

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
