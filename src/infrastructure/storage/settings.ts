import type { AppSettings } from '@domain/game/types';

import { clearJson, getJson, setJson } from './mmkv';

export const SETTINGS_STORAGE_KEY = 'kapelyukh.settings';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  theme: 'system',
  reduceMotion: 'system',
  sentryEnabled: true,
  hasSeenRules: false,
};

export function getSettings(): AppSettings {
  const saved = getJson<Partial<AppSettings>>(SETTINGS_STORAGE_KEY);
  if (!saved) {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function setSettings(settings: AppSettings): void {
  setJson(SETTINGS_STORAGE_KEY, settings);
}

export function clearSettings(): void {
  clearJson(SETTINGS_STORAGE_KEY);
}
