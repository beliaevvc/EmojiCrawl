import { useDrag } from 'react-dnd';
import { Card as CardType } from '../types/game';
import { ItemTypes } from '../types/DragTypes';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  onClick?: () => void;
}

const CardComponent = ({ card, isDraggable = true, onClick }: CardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    item: { id: card.id, type: card.type, value: card.value, spellType: card.spellType },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [card, isDraggable]);

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
    <div
      ref={drag}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`
        relative w-full h-full rounded-full border-2 ${getBorderColor()} ${getBgColor()}
        flex items-center justify-center text-3xl md:text-5xl shadow-lg 
        ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'} 
        select-none transition-transform
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

      {/* Spell Name Badge (Optional, but helps ID spells) */}
      {card.type === 'spell' && card.name && (
          <div className="absolute -bottom-2 px-1 py-0.5 bg-black/60 rounded text-[6px] md:text-[8px] text-indigo-200 uppercase tracking-wider border border-indigo-900/50">
              {card.name.substring(0, 4)}
          </div>
      )}
    </div>
  );
};

export default CardComponent;
