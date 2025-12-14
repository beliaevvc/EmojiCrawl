import { useDrag } from 'react-dnd';
import { Card as CardType } from '../types/game';
import { ItemTypes } from '../types/DragTypes';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MONSTER_ABILITIES } from '../data/monsterAbilities';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  onClick?: () => void;
  // Removed onVisualEffect from props as it is handled by parent now
}

const CardComponent = ({ card, isDraggable = true, onClick }: CardProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef(card.value);
  const [isShaking, setIsShaking] = useState(false);

  // Monitor value changes for animations (Shake/Ring only)
  useEffect(() => {
    if (card.type === 'spell' || card.type === 'coin') return; 

    const diff = card.value - prevValueRef.current;
    
    if (diff !== 0) {
       if (diff < 0) {
           // Damage taken -> Shake + Ring
           setIsShaking(true);
           setTimeout(() => setIsShaking(false), 300);
       }
       // Note: Floating text is now handled by GameScreen to ensure it shows even on death
    }
    
    prevValueRef.current = card.value;
  }, [card.value, card.type]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    item: { id: card.id, type: card.type, value: card.value, spellType: card.spellType },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [card, isDraggable]);

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
      drag(element);
      (elementRef as any).current = element;
  };

  const getBorderColor = () => {
    switch (card.type) {
      case 'monster': return 'border-rose-800';
      case 'weapon': return 'border-stone-400';
      case 'shield': return 'border-stone-600';
      case 'potion': return 'border-emerald-700';
      case 'coin': return 'border-amber-500';
      case 'spell': return 'border-indigo-500';
      default: return 'border-stone-700';
    }
  };

  const getBgColor = () => {
    switch (card.type) {
       case 'monster': return 'bg-rose-950/40';
       default: return 'bg-stone-800/80';
    }
  }

  return (
    <motion.div
      ref={setRefs}
      onClick={onClick}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ 
          scale: 1, 
          opacity: isDragging ? 0.5 : 1,
          x: isShaking ? [0, -5, 5, -5, 5, 0] : 0,
      }}
      exit={{ 
          scale: 0.5, 
          opacity: 0, 
          filter: "blur(10px)",
          transition: { duration: 0.3 } 
      }}
      transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          mass: 1
      }}
      className={`
        absolute inset-0 w-full h-full rounded-full border-2 ${getBorderColor()} ${getBgColor()}
        flex items-center justify-center text-3xl md:text-5xl shadow-lg 
        ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'} 
        select-none z-10
        ${isShaking ? 'ring-4 ring-rose-500' : ''}
      `}
    >
      {card.type !== 'spell' && (
        <div className={`
          absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-5 h-5 md:w-7 md:h-7 rounded-full 
          flex items-center justify-center text-[10px] md:text-xs font-bold shadow-md z-10
          ${card.type === 'monster' ? 'bg-rose-700 text-rose-100 border border-rose-500' : 'bg-stone-700 text-stone-200 border border-stone-500'}
        `}>
          {card.value}
        </div>
      )}
      
      <span className="drop-shadow-md">{card.icon}</span>

      {/* Monster Ability Badge */}
      {card.type === 'monster' && card.ability && (
          <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center shadow-lg z-20 text-xs md:text-sm" title={MONSTER_ABILITIES.find(a => a.id === card.ability)?.name}>
              {MONSTER_ABILITIES.find(a => a.id === card.ability)?.icon}
          </div>
      )}

      {/* Price Multiplier Badge */}
      {card.priceMultiplier && card.priceMultiplier > 1 && (
          <div className="absolute -top-1 -left-1 md:-top-2 md:-left-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-yellow-500 text-black font-bold text-[10px] flex items-center justify-center border border-yellow-300 shadow-md z-20">
              x{card.priceMultiplier}
          </div>
      )}

      {/* Spell Name Badge (Optional, but helps ID spells) */}
      {card.type === 'spell' && card.name && (
          <div className="absolute -bottom-2 px-1 py-0.5 bg-black/60 rounded text-[6px] md:text-[8px] text-indigo-200 uppercase tracking-wider border border-indigo-900/50">
              {card.name.substring(0, 4)}
          </div>
      )}
    </motion.div>
  );
};

export default CardComponent;
