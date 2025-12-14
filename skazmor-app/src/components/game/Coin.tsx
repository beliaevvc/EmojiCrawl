import { motion } from 'framer-motion';
import type { CardType } from '../../types';
import { cn } from '../../lib/utils';

interface CoinProps {
  type: CardType;
  value: number;
  emoji: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  isNew?: boolean; // For editor
  isModified?: boolean; // For editor
  size?: 'sm' | 'md' | 'lg';
}

const typeColors: Record<CardType, string> = {
  weapon: 'border-slate-400 bg-slate-800 text-slate-200',
  shield: 'border-slate-500 bg-slate-700 text-slate-300',
  potion: 'border-rose-900 bg-rose-950 text-rose-200',
  coin: 'border-amber-600 bg-amber-950 text-amber-200',
  monster: 'border-emerald-900 bg-emerald-950 text-emerald-200',
  ability: 'border-indigo-900 bg-indigo-950 text-indigo-200',
};

const typeRings: Record<CardType, string> = {
  weapon: 'ring-slate-600',
  shield: 'ring-slate-600',
  potion: 'ring-rose-800',
  coin: 'ring-amber-700',
  monster: 'ring-emerald-800',
  ability: 'ring-indigo-800',
};

export function Coin({ 
  type, 
  value, 
  emoji, 
  isSelected, 
  onClick, 
  className,
  isNew,
  isModified,
  size = 'md'
}: CoinProps) {
  
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-5xl',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'relative rounded-full flex items-center justify-center font-bold cursor-pointer select-none transition-shadow',
        'border-4 shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[4px]',
        typeColors[type],
        sizeClasses[size],
        isSelected && `ring-4 ring-offset-4 ring-offset-slate-900 ${typeRings[type]}`,
        className
      )}
    >
      {/* Emoji Content */}
      <span className="drop-shadow-md filter sepia-[0.2]">{emoji}</span>

      {/* Value Badge */}
      <div className={cn(
        "absolute -bottom-2 bg-slate-900 border-2 text-white font-mono rounded-full flex items-center justify-center shadow-md",
        typeColors[type].split(' ')[0], // Use the border color for badge border
        size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
      )}>
        {value}
      </div>

      {/* Editor Indicators */}
      {isNew && (
        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 rounded-full shadow-sm animate-pulse">
          NEW
        </div>
      )}
      {isModified && !isNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full shadow-sm" />
      )}
    </motion.div>
  );
}

