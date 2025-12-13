import { DeckTemplate, RunHistoryEntry } from '../types/game';

const TEMPLATES_KEY = 'skazmor_templates';
const HISTORY_KEY = 'skazmor_run_history';

// --- Templates ---

export const getTemplates = (): DeckTemplate[] => {
    try {
        const stored = localStorage.getItem(TEMPLATES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to load templates', e);
        return [];
    }
};

export const saveTemplate = (template: DeckTemplate): void => {
    const templates = getTemplates();
    const newTemplates = [...templates, template];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates));
};

export const deleteTemplate = (id: string): void => {
    const templates = getTemplates();
    const newTemplates = templates.filter(t => t.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates));
};

// --- History (Moving logic here if needed, but existing is in StatsScreen usually) ---
// For now let's keep History logic where it is or centralized later. 
// But we might need to access it easily.

export const getRunHistory = (): RunHistoryEntry[] => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const saveRunToHistory = (entry: RunHistoryEntry): void => {
    const history = getRunHistory();
    const newHistory = [entry, ...history];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

export const clearRunHistory = (): void => {
    localStorage.removeItem(HISTORY_KEY);
};

