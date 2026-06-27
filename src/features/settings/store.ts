import { create } from 'zustand';

import type { AppSettings } from '@domain/game/types';
import {
  DEFAULT_SETTINGS,
  getSettings,
  setSettings as persistSettings,
} from '@infrastructure/storage/settings';

type SettingsStore = {
  settings: AppSettings;
  hydrated: boolean;
  hydrate: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: () => {
    set({ settings: getSettings(), hydrated: true });
  },

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    persistSettings(next);
    set({ settings: next });
  },
}));

export function useAppSettings(): AppSettings {
  return useSettingsStore((store) => store.settings);
}
