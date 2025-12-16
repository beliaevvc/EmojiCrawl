import { motion } from 'framer-motion';
import { X, GitCommit, Clock } from 'lucide-react';
import versionData from '../data/version_history.json';

interface VersionModalProps {
    onClose: () => void;
}

export const VersionModal = ({ onClose }: VersionModalProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950/50">
                    <div>
                        <h2 className="text-xl font-bold text-stone-200 flex items-center gap-2">
                            <GitCommit className="text-emerald-500" />
                            CHANGELOG
                            <span className="text-xs font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700 ml-2">
                                {versionData.version.split('.')[2]} commits
                            </span>
                        </h2>
                        <p className="text-xs text-stone-500 mt-1">
                            Version: <span className="text-stone-300">{versionData.version}</span> • Last Build: {versionData.buildDate}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-500 hover:text-stone-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {versionData.commits.map((commit: any) => (
                        <div 
                            key={commit.hash} 
                            className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-3 hover:bg-stone-800 transition-colors group"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-sm text-stone-300 leading-relaxed font-medium">
                                    {commit.message}
                                </p>
                                <span className="text-[10px] font-mono text-stone-600 bg-stone-900 px-2 py-1 rounded shrink-0 group-hover:text-emerald-500/70 transition-colors">
                                    {commit.hash}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-500">
                                <Clock size={10} />
                                <span>{commit.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

