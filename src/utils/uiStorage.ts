export interface WindowPosition {
    x: number;
    y: number;
}

export interface UIState {
    positions: Record<string, WindowPosition>;
}

const STORAGE_KEY = 'skazmor_ui_state';

export const saveUIPositions = (positions: Record<string, WindowPosition>) => {
    try {
        const current = loadUIPositions();
        const merged = { ...current, ...positions };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ positions: merged }));
    } catch (e) {
        console.error('Failed to save UI positions', e);
    }
};

export const loadUIPositions = (): Record<string, WindowPosition> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.positions || {};
        }
    } catch (e) {
        console.error('Failed to load UI positions', e);
    }
    return {};
};

