export interface WindowPosition {
    x: number;
    y: number;
}

export interface HUDVisibility {
    deckStats: boolean;
    deckViewer: boolean;
    discardViewer: boolean;
    statsWindow: boolean;
    logWindow: boolean;
    labelsWindow: boolean;
}

export interface UIState {
    positions: Record<string, WindowPosition>;
    visibility: HUDVisibility;
}

const STORAGE_KEY = 'skazmor_ui_state';

const DEFAULT_VISIBILITY: HUDVisibility = {
    deckStats: true,
    deckViewer: true,
    discardViewer: true,
    statsWindow: true,
    logWindow: true,
    labelsWindow: true,
};

export const saveUIPositions = (positions: Record<string, WindowPosition>) => {
    try {
        const current = loadUIState();
        const newState = { ...current, positions: { ...current.positions, ...positions } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
        console.error('Failed to save UI positions', e);
    }
};

export const saveUIVisibility = (visibility: Partial<HUDVisibility>) => {
    try {
        const current = loadUIState();
        const newState = { ...current, visibility: { ...current.visibility, ...visibility } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
        console.error('Failed to save UI visibility', e);
    }
}

export const loadUIState = (): UIState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                positions: parsed.positions || {},
                visibility: { ...DEFAULT_VISIBILITY, ...(parsed.visibility || {}) }
            };
        }
    } catch (e) {
        console.error('Failed to load UI state', e);
    }
    return { positions: {}, visibility: DEFAULT_VISIBILITY };
};

export const loadUIPositions = (): Record<string, WindowPosition> => {
    return loadUIState().positions;
};

export const loadUIVisibility = (): HUDVisibility => {
    return loadUIState().visibility;
};
