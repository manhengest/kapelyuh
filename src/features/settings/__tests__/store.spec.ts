import { beforeEach, describe, expect, it } from '@jest/globals';

import { useSettingsStore } from '@features/settings/store';
import {
  clearSettings,
  DEFAULT_SETTINGS,
  getSettings,
  setSettings,
} from '@infrastructure/storage/settings';

describe('settings storage', () => {
  beforeEach(() => {
    clearSettings();
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, hydrated: false });
  });

  it('returns defaults when nothing is saved', () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists partial updates through the store', () => {
    useSettingsStore.getState().hydrate();
    useSettingsStore.getState().updateSettings({ soundEnabled: false, theme: 'dark' });

    expect(getSettings().soundEnabled).toBe(false);
    expect(getSettings().theme).toBe('dark');
    expect(getSettings().hapticsEnabled).toBe(true);
  });

  it('merges saved values with defaults for new keys', () => {
    setSettings({ ...DEFAULT_SETTINGS, sentryEnabled: false });
    expect(getSettings().sentryEnabled).toBe(false);
    expect(getSettings().hasSeenRules).toBe(false);
  });
});
