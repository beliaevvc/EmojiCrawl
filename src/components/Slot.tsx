import { useDrop } from 'react-dnd';
import { useState, useEffect } from 'react';
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
  location?: 'hand' | 'backpack' | 'field'; // Added location prop
}

const Slot = ({ card, onDrop, accepts, placeholderIcon, isBlocked, className = "", canDropItem, onInteract, onCardClick, penalty = 0, location }: SlotProps) => {
  const [isChildDragging, setIsChildDragging] = useState(false);

  // Reset drag state when card changes
  useEffect(() => {
      setIsChildDragging(false);
  }, [card]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: accepts,
    canDrop: (item: any) => {
        if (isBlocked) return false;
        
        // Traveling Merchant: токены торговца (товары/🚪) можно бросать только в пустые слоты инвентаря.
        // Это защищает от “ложного” режима таргетинга спелла, когда слот занят.
        if ((item?.merchantAction === 'leave' || item?.merchantOfferType) && card) {
          return false;
        }

        // INTERACTION LOGIC (Priority 1)
        // If this slot has an interaction handler for this item type (e.g. Monster), allow it
        if (onInteract && item.type === 'monster') return true;

        // “Молитва” (prayer_spell): можно таргетить ТОЛЬКО spell-карту в руке.
        if (item?.type === 'prayer_spell') {
          return location === 'hand' && !!card && card.type === 'spell';
        }

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
  }), [isBlocked, card, onDrop, accepts, canDropItem, onInteract, location]);

  const isActive = canDrop && isOver;
  
  // Visual feedback logic
  const isInteraction = canDrop && onInteract && isOver; 
  
  const showBackground = !card || isChildDragging;

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
        ${showBackground && !isBlocked ? 'border-2 border-dashed border-stone-700/50 bg-stone-800/30' : ''}
      `}
    >
      {/* Render placeholder only when background is shown (empty or dragging) */}
      {placeholderIcon && (
        <span className={`absolute inset-0 flex items-center justify-center text-3xl md:text-5xl text-stone-600 select-none grayscale pointer-events-none z-0 transition-opacity duration-200 ${showBackground ? 'opacity-40' : 'opacity-0'}`}>
          {placeholderIcon}
        </span>
      )}

      {card && (
        <CardComponent 
            card={card} 
            isDraggable={!isBlocked} 
            onClick={onCardClick} 
            penalty={penalty} 
            onDragChange={setIsChildDragging}
            location={location} // Pass location prop
        />
      )}
    </div>
  );
};

export default Slot;