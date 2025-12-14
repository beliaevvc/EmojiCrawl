import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { GameLayout } from '../layout/GameLayout';
import { Coin } from './Coin';
// import { motion } from 'framer-motion';
import { SKILLS } from '../../data/skills';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { DraggableCard, DroppableSlot } from './DndComponents';
import type { Card } from '../../types';

interface GameBoardProps {
    onExit: () => void;
}

export function GameBoard({ onExit }: GameBoardProps) {
    const { currentTemplateId, templates } = useEditorStore();
    const { startGame, isGameActive, hero, table, inventory, deck, dealCards, sellCard, moveCardToInventory, useItemOnMonster, useSkill } = useGameStore();
    const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<Card | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor)
    );

    useEffect(() => {
        const template = templates.find(t => t.id === currentTemplateId);
        if (template && !isGameActive) {
            startGame(template);
        }
    }, [currentTemplateId, templates, isGameActive, startGame]);

    const handleDragStart = (event: any) => {
        setActiveDragItem(event.active.data.current.card);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const source = active.data.current?.source;
        const sourceIndex = active.data.current?.index;
        const targetId = over.id as string;
        
        // Logic for DnD Actions
        if (source === 'table' && targetId.startsWith('inv-')) {
            const slot = targetId.replace('inv-', '') as 'left' | 'backpack' | 'right';
            moveCardToInventory(sourceIndex, slot);
        }
        else if (targetId === 'shop' && source === 'table') {
            sellCard(sourceIndex);
        }
        else if (source?.startsWith('inventory-') && targetId.startsWith('table-')) {
            const slot = source.replace('inventory-', '') as 'left' | 'backpack' | 'right';
            const tableIdx = parseInt(targetId.replace('table-', ''));
            useItemOnMonster(slot, tableIdx);
        }
    };

    if (!isGameActive) return <div className="text-center p-20">Loading Dungeon...</div>;

    return (
        <GameLayout>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* Header / HUD */}
                <div className="bg-slate-900/80 p-4 flex justify-between items-center border-b border-slate-800">
                    <div className="flex gap-6 text-xl font-mono font-bold">
                        <span className="text-rose-500">❤️ {hero.currentHp}/{hero.maxHp}</span>
                        <span className="text-amber-400">💰 {hero.gold}</span>
                    </div>
                    
                    <div className="flex gap-2">
                        {hero.skills.map(skillId => (
                            <button 
                                key={skillId}
                                onClick={() => setActiveSkillId(activeSkillId === skillId ? null : skillId)}
                                className={`px-3 py-1 rounded text-xs border transition-colors ${
                                    activeSkillId === skillId 
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                                    : 'bg-indigo-900/50 border-indigo-700/50 text-indigo-300 hover:bg-indigo-800'
                                }`}
                            >
                                {SKILLS.find(s => s.id === skillId)?.name || skillId}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                         <div className="text-slate-500">Deck: {deck.length}</div>
                         <button onClick={onExit} className="text-slate-500 hover:text-white">EXIT</button>
                    </div>
                </div>

                {/* Main Play Area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-12 p-8 relative">
                    
                    {/* Enemy/Table Row */}
                    <div className="flex gap-4">
                        {table.map((card, idx) => (
                            <DroppableSlot 
                                key={`table-${idx}`} 
                                id={`table-${idx}`} 
                                isEmpty={card === null}
                                className="w-32 h-32 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center relative bg-slate-900/30"
                            >
                                {card ? (
                                    <DraggableCard 
                                        card={card} 
                                        id={`card-table-${idx}`} 
                                        index={idx} 
                                        source="table"
                                    />
                                ) : (
                                    <span className="text-slate-800 text-4xl select-none">⚫</span>
                                )}
                                
                                {/* Skill Overlay Button if Active */}
                                {activeSkillId && card && (
                                     <button 
                                        onClick={() => { useSkill(activeSkillId, idx); setActiveSkillId(null); }}
                                        className="absolute inset-0 bg-indigo-500/30 hover:bg-indigo-500/50 rounded-full z-50 flex items-center justify-center font-bold text-white tracking-widest backdrop-blur-sm"
                                     >
                                        TARGET
                                     </button>
                                )}
                            </DroppableSlot>
                        ))}
                    </div>

                    {/* Hero/Inventory Row */}
                    <div className="flex gap-8 items-end">
                        <DroppableSlot id="inv-left" isEmpty={inventory.left === null} className="flex flex-col items-center gap-2">
                            <div className="w-32 h-32 border-2 border-slate-600 rounded-full flex items-center justify-center bg-slate-900 relative">
                                {inventory.left ? (
                                    <DraggableCard card={inventory.left} id="inv-card-left" index={0} source="inventory-left" />
                                ) : <span className="text-slate-700 text-2xl">✋</span>}
                            </div>
                            <span className="text-xs font-bold text-slate-500 tracking-widest">LEFT HAND</span>
                        </DroppableSlot>
                        
                        <div className="mb-8">
                             <DroppableSlot id="inv-backpack" isEmpty={inventory.backpack === null} className="flex flex-col items-center gap-2">
                                <div className="w-32 h-32 border-2 border-slate-600 rounded-full flex items-center justify-center bg-slate-900 relative">
                                    {inventory.backpack ? (
                                        <DraggableCard card={inventory.backpack} id="inv-card-backpack" index={0} source="inventory-backpack" />
                                    ) : <span className="text-slate-700 text-2xl">🎒</span>}
                                </div>
                                <span className="text-xs font-bold text-slate-500 tracking-widest">BACKPACK</span>
                            </DroppableSlot>
                        </div>

                         <DroppableSlot id="inv-right" isEmpty={inventory.right === null} className="flex flex-col items-center gap-2">
                            <div className="w-32 h-32 border-2 border-slate-600 rounded-full flex items-center justify-center bg-slate-900 relative">
                                {inventory.right ? (
                                    <DraggableCard card={inventory.right} id="inv-card-right" index={0} source="inventory-right" />
                                ) : <span className="text-slate-700 text-2xl">✋</span>}
                            </div>
                            <span className="text-xs font-bold text-slate-500 tracking-widest">RIGHT HAND</span>
                        </DroppableSlot>
                    </div>

                    <button 
                        onClick={dealCards}
                        disabled={deck.length === 0 || table.every(c => c !== null)}
                        className="mt-8 bg-slate-800 px-8 py-3 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        DEAL CARDS
                    </button>

                    {/* Shop Zone */}
                    <DroppableSlot id="shop" isEmpty={true} type="shop" className="absolute bottom-8 right-8 w-24 h-24 border-2 border-dashed border-amber-900/50 rounded-full flex items-center justify-center hover:border-amber-500 hover:bg-amber-900/20 transition-all">
                        <span className="text-2xl">🏪</span>
                    </DroppableSlot>
                </div>

                <DragOverlay>
                    {activeDragItem ? (
                        <Coin type={activeDragItem.type} value={activeDragItem.value} emoji={activeDragItem.emoji} size="lg" />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </GameLayout>
    );
}
