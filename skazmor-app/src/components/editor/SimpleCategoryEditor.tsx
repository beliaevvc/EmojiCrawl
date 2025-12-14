import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '../../types';
import { useEditorStore } from '../../stores/useEditorStore';
import { CATEGORY_META } from '../../lib/constants';
import { EditorLayout } from '../layout/EditorLayout';
import { Coin } from '../game/Coin';

interface SimpleCategoryEditorProps {
    category: Category;
    onBack: () => void;
}

export function SimpleCategoryEditor({ category, onBack }: SimpleCategoryEditorProps) {
    const { currentTemplateId, templates, addCard, removeCardByValue } = useEditorStore();
    const template = templates.find(t => t.id === currentTemplateId);
    
    // We only support non-monster categories here
    if (!template || category === 'monster') return null;

    const meta = CATEGORY_META[category];
    // @ts-ignore
    const items: { value: number; count: number }[] = template.deck[category + 's'] || [];
    
    // Expand items for display
    const expandedItems = items.flatMap(item => 
        Array(item.count).fill(item.value)
    ).sort((a, b) => a - b); // Sort by value

    const handleAdd = () => {
        addCard(category, 1);
    };

    const handleRemove = (value: number) => {
        removeCardByValue(category, value);
    };

    const handleCycleValue = (oldValue: number) => {
        // Remove old, add new (old + 1)
        removeCardByValue(category, oldValue);
        addCard(category, oldValue >= 9 ? 1 : oldValue + 1);
    };

    return (
        <EditorLayout 
            title={`EDITING: ${meta.label}`} 
            onBack={onBack}
            actions={
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                    COUNT: <span className="font-bold text-white">{expandedItems.length}</span>
                </div>
            }
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 justify-items-center">
                
                {/* Add Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    className="w-24 h-24 rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-500 transition-colors bg-slate-900/50"
                >
                    <span className="text-4xl">➕</span>
                </motion.button>

                {/* Coins */}
                <AnimatePresence mode="popLayout">
                    {expandedItems.map((val, idx) => (
                        <motion.div
                            key={`${val}-${idx}`}
                            layout
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="relative">
                                <Coin 
                                    type={category} 
                                    value={val} 
                                    emoji={meta.emoji}
                                    onClick={() => handleCycleValue(val)}
                                    className="hover:z-10"
                                />
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                    Click to Upgrade
                                </div>
                            </div>

                            <button 
                                onClick={() => handleRemove(val)}
                                className="text-rose-500 hover:text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 px-3 py-0.5 rounded-full text-sm border border-rose-900/50 transition-colors"
                            >
                                Remove
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </EditorLayout>
    );
}

