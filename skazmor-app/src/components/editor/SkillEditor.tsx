import { motion } from 'framer-motion';
import { useEditorStore } from '../../stores/useEditorStore';
import { EditorLayout } from '../layout/EditorLayout';
import { SKILLS } from '../../data/skills';

interface SkillEditorProps {
    onBack: () => void;
}

export function SkillEditor({ onBack }: SkillEditorProps) {
    const { currentTemplateId, templates, updateTemplateSkills } = useEditorStore();
    const template = templates.find(t => t.id === currentTemplateId);

    if (!template) return null;

    const toggleSkill = (skillId: string) => {
        const currentSkills = template.skills || [];
        if (currentSkills.includes(skillId)) {
            updateTemplateSkills(currentSkills.filter(id => id !== skillId));
        } else {
            // Limit to 5 skills?
            if (currentSkills.length < 5) {
                updateTemplateSkills([...currentSkills, skillId]);
            } else {
                alert("Max 5 skills allowed!");
            }
        }
    };

    return (
        <EditorLayout 
            title={`SKILLS (${template.skills.length}/5)`} 
            onBack={onBack}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {SKILLS.map(skill => {
                    const isSelected = template.skills.includes(skill.id);
                    return (
                        <motion.button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border text-left transition-all ${
                                isSelected 
                                ? 'bg-indigo-900/50 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className={`font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                                    {skill.name}
                                </h3>
                                {isSelected && <span className="text-indigo-400">⚡</span>}
                            </div>
                            <p className="text-sm text-slate-400">{skill.description}</p>
                        </motion.button>
                    );
                })}
            </div>
        </EditorLayout>
    );
}

