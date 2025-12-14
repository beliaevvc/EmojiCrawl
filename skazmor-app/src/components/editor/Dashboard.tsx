import { useEditorStore } from '../../stores/useEditorStore';
import { EditorLayout } from '../layout/EditorLayout';
import { motion } from 'framer-motion';

interface DashboardProps {
    onSelectTemplate: (id: string) => void;
    onCreateTemplate: () => void;
}

export function Dashboard({ onSelectTemplate, onCreateTemplate }: DashboardProps) {
    const { templates } = useEditorStore();

    return (
        <EditorLayout 
            title="YOUR TEMPLATES"
            actions={
                <button className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1 rounded border border-slate-700">
                    Import JSON
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateTemplate}
                    className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 transition-colors group"
                >
                    <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">➕</span>
                    <span className="font-bold text-slate-400 group-hover:text-slate-200">CREATE NEW</span>
                </motion.div>

                {/* Template List */}
                {templates.map(template => (
                    <motion.div
                        key={template.id}
                        layoutId={template.id}
                        whileHover={{ y: -4 }}
                        onClick={() => onSelectTemplate(template.id)}
                        className="aspect-video bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-slate-500 hover:shadow-xl transition-all relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl">
                            📜
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{template.name}</h3>
                        <div className="space-y-1 text-sm text-slate-400">
                            <p>HP: <span className="text-rose-400">{template.hero.maxHp}</span></p>
                            <p>Cards: {Object.values(template.deck).reduce((acc, arr) => acc + arr.length, 0)}</p>
                        </div>
                        
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm">
                                EDIT
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </EditorLayout>
    );
}

