/**
 * CardComponent — базовый UI-компонент отображения одной карты (token/card) в бою и в UI.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - рисует внешний вид карты по `card.type`,
 * - поддерживает drag&drop (react-dnd),
 * - показывает вспомогательные бейджи/иконки (например способность монстра),
 * - содержит небольшие UI-only эффекты (shake/ring при изменении value).
 *
 * Важно (границы слоёв):
 * - здесь НЕТ доменной логики (правил боя) — только отображение и интеракции UI,
 * - компонент не должен импортить `src/data/*`.
 *
 * Блок 4 (Content Layer):
 * - “справочные” данные для UI (иконки/названия/описания способностей/заклинаний/проклятий)
 *   приходят через `baseGameContent` (application слой), а не прямыми импортами из `data`.
 * - это позволяет дальше вводить content packs без переписывания UI.
 */
import { useDrag } from 'react-dnd';
import { Card as CardType } from '../types/game';
import { ItemTypes } from '../types/DragTypes';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { baseGameContent } from '@/features/game/application/gameContent';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  onClick?: () => void;
  isBlocked?: boolean;
  penalty?: number; // Visual modifier (can be negative or positive)
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

  const isMerchantArtifact =
    card.type === 'bravery_potion' || card.type === 'claymore' || card.type === 'prayer_spell';
  const isMerchantLeave = card.merchantAction === 'leave';

  const getBorderColor = () => {
    // По ТЗ визуала: все артефакты торговца имеют золотую обводку (единый стиль).
    if (isMerchantArtifact) return 'border-amber-400';
    // 🚪 “Уйти” — отдельный стиль (не золотой).
    if (isMerchantLeave) return 'border-stone-500';
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
    // Важно: токены торговца НЕ должны просвечивать (под ними часто лежит “последняя карта раунда”).
    // Поэтому фон делаем полностью непрозрачным.
    if (isMerchantLeave) return 'bg-stone-950';
    switch (card.type) {
       case 'monster': return 'bg-rose-950/40';
       case 'skull': return 'bg-stone-950/60';
       // Артефакты торговца делаем чуть “дороже” фоном, shimmer добавит золото сверху.
       case 'bravery_potion':
       case 'claymore':
       case 'prayer_spell':
        return 'bg-amber-950';
       default: return 'bg-stone-800/80';
    }
  }

  const modifier = penalty || 0;
  const isModified = modifier !== 0;
  const isBuff = modifier > 0;

  // Coins: do NOT "change nominal" in the main badge; show bonus separately.
  const applyModifierToMainBadge = card.type !== 'coin';
  const displayValue = (isModified && applyModifierToMainBadge) ? Math.max(0, card.value + modifier) : card.value;
  const modifierLabel = modifier > 0 ? `+${modifier}` : `${modifier}`;

  // Для токенов торговца (товары/🚪) нельзя снижать opacity, иначе будет видно то, что лежит под ними.
  // Состояние “нельзя купить” показываем grayscale/кольцами, но не прозрачностью.
  const isMerchantToken =
    isMerchantArtifact ||
    isMerchantLeave ||
    typeof (card as any).merchantPrice === 'number' ||
    !!(card as any).merchantOfferType;

  const blockedOpacity = isMerchantToken ? 1 : 0.6;

  return (
    <motion.div
      ref={setRefs}
      onClick={!card.isHidden ? onClick : undefined}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ 
          scale: 1, 
          opacity: isDragging ? 0 : (isBlocked ? blockedOpacity : 1), // Hide original when dragging to show slot underneath
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
        ${isModified ? (isBuff ? 'ring-2 ring-emerald-500/50' : 'ring-2 ring-rose-500/50') : ''} 
        ${isMerchantArtifact ? 'shadow-[0_0_18px_rgba(251,191,36,0.22)] ring-1 ring-amber-300/30' : ''}
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
            {/* Traveling Merchant: мягкий золотой shimmer (внутренний) */}
            {isMerchantArtifact && (
              <div className="merchant-shimmer-clip">
                <div className="merchant-shimmer-stripe" />
              </div>
            )}

            {card.type !== 'spell' && (
                <div className={`
                absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-5 h-5 md:w-7 md:h-7 rounded-full 
                flex items-center justify-center text-[10px] md:text-xs font-bold shadow-md z-10
                ${isModified
                    ? (isBuff ? 'bg-stone-900 text-emerald-300 border border-emerald-500' : 'bg-stone-900 text-rose-400 border border-rose-500')
                    : (card.type === 'monster' ? 'bg-rose-700 text-rose-100 border border-rose-500' : 'bg-stone-700 text-stone-200 border border-stone-500')}
                `}>
                {displayValue}
                </div>
            )}
            
            {/* Penalty Indicator */}
            {isModified && (
                <div className={`absolute bottom-5 -right-2 md:bottom-7 md:-right-3 text-[10px] md:text-xs font-bold drop-shadow-black animate-pulse bg-black/50 px-1 rounded ${isBuff ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {modifierLabel}
                </div>
            )}
            
            <span className="drop-shadow-md">{card.icon}</span>

            {/* Monster Ability Badge */}
            {card.type === 'monster' && card.ability && (
                <div
                    className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center shadow-lg z-20 text-xs md:text-sm"
                    // Блок 4: название способности берём из `baseGameContent`, а не из `src/data/*`.
                    title={baseGameContent.monsterAbilitiesById[card.ability]?.name}
                >
                    {baseGameContent.monsterAbilitiesById[card.ability]?.icon}
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

            {/* Traveling Merchant Price Badge */}
            {typeof (card as any).merchantPrice === 'number' && (
                <div
                    className="absolute -top-1 -left-1 md:-top-2 md:-left-2 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black font-bold text-[9px] md:text-[10px] border border-amber-200 shadow-md z-20"
                    title="Цена торговца (💎)"
                >
                    💎{(card as any).merchantPrice}
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