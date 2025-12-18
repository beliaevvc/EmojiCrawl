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
  isBlocked?: boolean;
  penalty?: number; // New prop for visual penalty
  onDragChange?: (isDragging: boolean) => void;
  location?: 'hand' | 'backpack' | 'field'; // Added location prop
}

const CardComponent = ({ card, isDraggable = true, onClick, isBlocked = false, penalty = 0, onDragChange, location }: CardProps) => { // Updated props
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
    item: { ...card, location }, // Include location in drag item
    canDrag: isDraggable && !isBlocked && !card.isHidden, // Disable drag if blocked or hidden
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [card, isDraggable, isBlocked, location]); // Added location to deps

  // Notify parent about drag state
  useEffect(() => {
    if (onDragChange) {
        onDragChange(isDragging);
    }
  }, [isDragging, onDragChange]);

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
      case 'skull': return 'border-stone-600';
      default: return 'border-stone-700';
    }
  };

  const getBgColor = () => {
    switch (card.type) {
       case 'monster': return 'bg-rose-950/40';
       case 'skull': return 'bg-stone-950/60';
       default: return 'bg-stone-800/80';
    }
  }

  const displayValue = penalty ? Math.max(0, card.value + penalty) : card.value;
  const isDebuffed = penalty !== 0;

  return (
    <motion.div
      ref={setRefs}
      onClick={!card.isHidden ? onClick : undefined}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ 
          scale: 1, 
          opacity: isDragging ? 0 : (isBlocked ? 0.6 : 1), // Hide original when dragging to show slot underneath
          filter: isBlocked ? 'grayscale(0.8)' : 'none', // Grayscale for blocked
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
        ${(isDraggable && !isBlocked) ? 'cursor-grab active:cursor-grabbing hover:scale-105' : (onClick ? 'cursor-help' : 'cursor-default')} 
        select-none z-10
        ${isShaking ? 'ring-4 ring-rose-500' : ''}
        ${isDebuffed ? 'ring-2 ring-rose-500/50' : ''} 
      `}
    >
      {/* Card Back for Hidden Cards (Universal) */}
      {card.isHidden && (
         <div className="absolute inset-0 bg-stone-950 rounded-full flex items-center justify-center z-50 border-2 border-stone-700 overflow-hidden">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #44403c 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
             <div className="text-3xl opacity-10 font-display">?</div>
         </div>
      )}

      {/* Content (Only if not hidden) */}
      {!card.isHidden && (
        <>
            {card.type !== 'spell' && (
                <div className={`
                absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-5 h-5 md:w-7 md:h-7 rounded-full 
                flex items-center justify-center text-[10px] md:text-xs font-bold shadow-md z-10
                ${isDebuffed ? 'bg-stone-900 text-rose-400 border border-rose-500' : (card.type === 'monster' ? 'bg-rose-700 text-rose-100 border border-rose-500' : 'bg-stone-700 text-stone-200 border border-stone-500')}
                `}>
                {displayValue}
                </div>
            )}
            
            {/* Penalty Indicator */}
            {isDebuffed && (
                <div className="absolute bottom-5 -right-2 md:bottom-7 md:-right-3 text-[10px] md:text-xs font-bold text-rose-500 drop-shadow-black animate-pulse bg-black/50 px-1 rounded">
                    {penalty}
                </div>
            )}
            
            <span className="drop-shadow-md">{card.icon}</span>

            {/* Monster Ability Badge */}
            {card.type === 'monster' && card.ability && (
                <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center shadow-lg z-20 text-xs md:text-sm" title={MONSTER_ABILITIES.find(a => a.id === card.ability)?.name}>
                    {MONSTER_ABILITIES.find(a => a.id === card.ability)?.icon}
                </div>
            )}

            {/* Monster Label (Moved to Top Left) */}
            {card.type === 'monster' && card.label && !isBlocked && (
                <div 
                    className="absolute -top-1 left-2 w-3 h-3 rounded-full border border-stone-900 shadow-lg z-20"
                    title={card.label}
                    style={{
                        backgroundColor: 
                            card.label === 'ordinary' ? '#10b981' :
                            card.label === 'tank' ? '#eab308' :
                            card.label === 'medium' ? '#f97316' :
                            card.label === 'mini-boss' ? '#a855f7' :
                            card.label === 'boss' ? '#e11d48' : 'transparent'
                    }}
                />
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
        </>
      )}
    </motion.div>
  );
};

export default CardComponent;