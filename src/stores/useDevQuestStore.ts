import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUEST_ANOMALIES } from '../data/devQuest';

interface AnomalyState {
  id: string;
  isFound: boolean;
  hintsBought: number; // 0 = none, 1 = level 1, 2 = level 2, 3 = level 3
}

interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'hint' | 'system';
}

interface DevQuestState {
  isConsoleOpen: boolean;
  isQuestActive: boolean;
  balance: number;
  anomalies: Record<string, AnomalyState>;
  logs: LogEntry[];
  
  // Actions
  toggleConsole: () => void;
  startQuest: () => void;
  buyHint: (anomalyId: string, level: 1 | 2 | 3, cost: number) => void;
  completeAnomaly: (anomalyId: string) => void;
  addLog: (message: string, type?: LogEntry['type']) => void;
  resetQuest: () => void;
}

const INITIAL_BALANCE = 200;

export const useDevQuestStore = create<DevQuestState>()(
  persist(
    (set, get) => ({
      isConsoleOpen: false,
      isQuestActive: false,
      balance: INITIAL_BALANCE,
      anomalies: QUEST_ANOMALIES.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: { id: curr.id, isFound: false, hintsBought: 0 }
      }), {} as Record<string, AnomalyState>),
      logs: [],

      toggleConsole: () => set((state) => ({ isConsoleOpen: !state.isConsoleOpen })),

      addLog: (message, type = 'info') => set((state) => ({
        logs: [
          ...state.logs,
          {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            message,
            type
          }
        ].slice(-50) // Keep last 50 logs
      })),

      startQuest: () => {
        const state = get();
        if (state.isQuestActive) return;

        state.addLog('Протокол запущен. Удачи.', 'system');
        set({ isQuestActive: true });
      },

      buyHint: (anomalyId, level, cost) => {
        const state = get();
        const anomaly = state.anomalies[anomalyId];
        
        if (!anomaly) return;
        if (state.balance < cost) {
          state.addLog('ERROR: INSUFFICIENT FUNDS.', 'error');
          return;
        }

        // Check if previous level bought (optional, but logical - but doc doesn't strictly say so, it implies buying specific hint buttons. 
        // Actually the UI shows [HINT $5] [LOGIC $10] [MANUAL $25]. It seems you can buy any. 
        // Let's assume you can buy any, but usually people go in order. 
        // The state `hintsBought` is a number, implying progression. Let's assume max(current, level).
        
        set((state) => ({
          balance: state.balance - cost,
          anomalies: {
            ...state.anomalies,
            [anomalyId]: {
              ...anomaly,
              hintsBought: Math.max(anomaly.hintsBought, level)
            }
          }
        }));

        const anomalyData = QUEST_ANOMALIES.find(a => a.id === anomalyId);
        let hintText = '';
        if (level === 1) hintText = anomalyData?.hints.level1.text || '';
        if (level === 2) hintText = anomalyData?.hints.level2.text || '';
        if (level === 3) hintText = anomalyData?.hints.level3.text || '';

        state.addLog(`Покупка подсказки ${anomalyId} (Lvl ${level}).`, 'info');
        state.addLog(`HINT: "${hintText}"`, 'hint');
        
        if (level === 3) {
           state.addLog('AI: "Надеюсь, тебе стыдно."', 'system');
        }
      },

      completeAnomaly: (anomalyId) => {
        const state = get();
        const anomaly = state.anomalies[anomalyId];
        
        if (!state.isQuestActive) return; // Only if quest is active
        if (!anomaly || anomaly.isFound) return;

        set((state) => ({
          anomalies: {
            ...state.anomalies,
            [anomalyId]: {
              ...anomaly,
              isFound: true
            }
          }
        }));

        state.addLog(`ANOMALY DETECTED: ${anomalyId}. SYSTEM STABILIZING...`, 'success');
      },

      resetQuest: () => set((state) => ({
        isConsoleOpen: false, // Ensure console closes
        isQuestActive: false,
        balance: INITIAL_BALANCE,
        anomalies: QUEST_ANOMALIES.reduce((acc, curr) => ({
          ...acc,
          [curr.id]: { id: curr.id, isFound: false, hintsBought: 0 }
        }), {} as Record<string, AnomalyState>),
        logs: []
      }))
    }),
    {
      name: 'dev-quest-storage',
    }
  )
);

