import { RunHistoryEntry, GameStats, Overheads } from '../types/game';

const STORAGE_KEY = 'skazmor_run_history';

export const saveRun = (stats: GameStats, result: 'won' | 'lost', overheads: Overheads) => {
    const history = getRunHistory();
    const gameNumber = history.length + 1;
    
    // Check if this run was already saved to prevent duplicates on re-renders
    // Using startTime as a unique identifier for the session
    const existing = history.find(h => h.startTime === stats.startTime);
    if (existing) return;

    const newEntry: RunHistoryEntry = {
        ...stats,
        id: Math.random().toString(36).substr(2, 9),
        gameNumber,
        date: new Date().toISOString(),
        result,
        overheads
    };
    
    // Add to beginning of array
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...history]));
};

export const getRunHistory = (): RunHistoryEntry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load history", e);
        return [];
    }
};

export const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
};

