// DragTypes.ts
export const ItemTypes = {
  CARD: 'card',
};

// Interface for drag item
export interface DraggedItem {
  id: string;
  type: string;
  value: number;
  origin: 'field' | 'hand' | 'backpack'; // Where the card comes from
  handSide?: 'left' | 'right'; // If from hand, which one
}
