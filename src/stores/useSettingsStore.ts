import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isScreensaverEnabled: boolean;
  toggleScreensaver: () => void;
  setScreensaverEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isScreensaverEnabled: true,
      toggleScreensaver: () => set((state) => ({ isScreensaverEnabled: !state.isScreensaverEnabled })),
      setScreensaverEnabled: (enabled: boolean) => set({ isScreensaverEnabled: enabled }),
    }),
    {
      name: 'skazmor-settings',
    }
  )
);

