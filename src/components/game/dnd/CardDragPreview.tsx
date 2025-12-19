import type { Card } from '@/types/game';

type DragSize = { width: number; height: number };

export type DragPreviewCard = Card & {
  location?: 'hand' | 'backpack' | 'field';
  __dragSize?: DragSize;
};

function isMerchantArtifact(card: DragPreviewCard) {
  return card.type === 'bravery_potion' || card.type === 'claymore' || card.type === 'prayer_spell';
}

function isMerchantLeave(card: DragPreviewCard) {
  return card.merchantAction === 'leave';
}

function getBorderColor(card: DragPreviewCard) {
  if (isMerchantArtifact(card)) return 'border-amber-400';
  if (isMerchantLeave(card)) return 'border-stone-500';

  switch (card.type) {
    case 'monster':
      return 'border-rose-800';
    case 'weapon':
      return 'border-stone-400';
    case 'shield':
      return 'border-stone-600';
    case 'potion':
      return 'border-emerald-700';
    case 'coin':
      return 'border-amber-500';
    case 'spell':
      return 'border-indigo-500';
    case 'skull':
      return 'border-stone-600';
    default:
      return 'border-stone-700';
  }
}

function getBgColor(card: DragPreviewCard) {
  // Merchant tokens should be fully opaque (there can be a “last card” underneath).
  if (isMerchantLeave(card)) return 'bg-stone-950';
  if (isMerchantArtifact(card)) return 'bg-amber-950';

  switch (card.type) {
    case 'monster':
      return 'bg-rose-950/40';
    case 'skull':
      return 'bg-stone-950/60';
    default:
      return 'bg-stone-800/80';
  }
}

export function CardDragPreview({ card }: { card: DragPreviewCard }) {
  const size = card.__dragSize;
  const width = size?.width ?? 96;
  const height = size?.height ?? 96;

  const showValueBadge = card.type !== 'spell';
  const merchantPrice = typeof (card as any).merchantPrice === 'number' ? (card as any).merchantPrice : null;

  return (
    <div
      style={{ width, height }}
      className={[
        'relative rounded-full border-2 shadow-lg',
        'flex items-center justify-center select-none',
        'pointer-events-none',
        getBorderColor(card),
        getBgColor(card),
        isMerchantArtifact(card) ? 'shadow-[0_0_18px_rgba(251,191,36,0.22)] ring-1 ring-amber-300/30' : '',
      ].join(' ')}
    >
      {/* Icon */}
      <span className="drop-shadow-md text-3xl md:text-5xl">{card.icon}</span>

      {/* Value badge (same rule as CardComponent: hide for spells) */}
      {showValueBadge && (
        <div
          className={[
            'absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2',
            'w-5 h-5 md:w-7 md:h-7 rounded-full',
            'flex items-center justify-center text-[10px] md:text-xs font-bold shadow-md',
            card.type === 'monster'
              ? 'bg-rose-700 text-rose-100 border border-rose-500'
              : 'bg-stone-700 text-stone-200 border border-stone-500',
          ].join(' ')}
        >
          {card.value}
        </div>
      )}

      {/* Merchant price badge (💎15) — keep it attached to the preview to avoid “coin drifting” */}
      {merchantPrice != null && (
        <div
          className={[
            'absolute -top-1 -left-1 md:-top-2 md:-left-2',
            'px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black',
            'font-bold text-[9px] md:text-[10px] border border-amber-200 shadow-md',
          ].join(' ')}
        >
          💎{merchantPrice}
        </div>
      )}
    </div>
  );
}


