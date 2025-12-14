import { useDrop } from 'react-dnd';
import { Card as CardType } from '../types/game';
import CardComponent from './CardComponent';

interface SlotProps {
  card: CardType | null;
  onDrop: (item: any) => void;
  accepts: string[];
  placeholderIcon?: string;
  isBlocked?: boolean;
  className?: string;
  canDropItem?: (item: any) => boolean;
  onInteract?: (item: any) => void;
  onCardClick?: () => void;
  penalty?: number;
}

const Slot = ({ card, onDrop, accepts, placeholderIcon, isBlocked, className = "", canDropItem, onInteract, onCardClick, penalty = 0 }: SlotProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: accepts,
    canDrop: (item: any) => {
        if (isBlocked) return false;
        
        // INTERACTION LOGIC (Priority 1)
        // If this slot has an interaction handler for this item type (e.g. Monster), allow it
        if (onInteract && item.type === 'monster') return true;

        // EQUIP LOGIC (Priority 2)
        // If we have a custom validator for equipping (e.g. no monsters in hand), check it
        if (canDropItem && !canDropItem(item)) return false;

        // If slot is empty, standard drop
        if (!card) return true;
        
        // If slot is occupied:
        // Allow drop IF item is a Spell (Magic targeting)
        if (card && item.type === 'spell') return true;
        
        return false;
    },
    drop: (item: any) => {
        // If it's a monster and we have an interaction handler, trigger interaction
        if (onInteract && item.type === 'monster') {
            onInteract(item);
        } else {
            // Otherwise, trigger standard equip drop
            onDrop(item);
        }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [isBlocked, card, onDrop, accepts, canDropItem, onInteract]);

  const isActive = canDrop && isOver;
  
  // Visual feedback logic
  const isInteraction = canDrop && onInteract && isOver; 

  return (
    <div
      ref={drop}
      className={`
        aspect-square rounded-full flex items-center justify-center transition-all duration-200 relative
        ${className}
        ${isBlocked ? 'opacity-50 grayscale cursor-not-allowed border-stone-800 bg-stone-900/50' : ''}
        ${isActive ? 'scale-105 ring-2' : ''} 
        ${isActive && !isInteraction ? 'bg-stone-700/50 border-stone-400 ring-indigo-500' : ''}
        ${isActive && isInteraction ? 'bg-rose-900/30 border-rose-500 ring-rose-500' : ''}
        ${!card && !isBlocked ? 'border-2 border-dashed border-stone-700/50 bg-stone-800/30' : ''}
      `}
    >
      {card ? (
        <CardComponent card={card} isDraggable={!isBlocked} onClick={onCardClick} penalty={penalty} />
      ) : (
        <span className="text-3xl md:text-5xl text-stone-600 opacity-40 select-none grayscale">
          {placeholderIcon}
        </span>
      )}
    </div>
  );
};

export default Slot;
