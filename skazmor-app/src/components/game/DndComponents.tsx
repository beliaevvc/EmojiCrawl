import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../../types';
import { Coin } from './Coin';

interface DraggableCardProps {
    card: Card;
    id: string; // Unique ID for DnD
    index: number; // For logic
    source: 'table' | 'inventory-left' | 'inventory-backpack' | 'inventory-right';
    disabled?: boolean;
}

export function DraggableCard({ card, id, index, source, disabled }: DraggableCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { card, index, source },
        disabled
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 100 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none cursor-grab active:cursor-grabbing">
            <Coin 
                type={card.type} 
                value={card.value} 
                emoji={card.emoji} 
                size="lg"
                className={isDragging ? 'opacity-0' : ''}
            />
            {/* Custom Drag Preview is handled by DndContext usually, but basic transform works for now */}
        </div>
    );
}

interface DroppableSlotProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    isEmpty: boolean;
    type?: 'table' | 'inventory' | 'shop';
}

export function DroppableSlot({ id, children, className, isEmpty, type = 'table' }: DroppableSlotProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: { type, isEmpty }
    });

    return (
        <div 
            ref={setNodeRef} 
            className={`${className} ${isOver ? 'ring-4 ring-rose-400/50 bg-slate-800/50' : ''} transition-all duration-200`}
        >
            {children}
        </div>
    );
}

