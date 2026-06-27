// Jest setup — extend in Phase 2 when adding component tests.

jest.mock('react-native-mmkv', () => {
  const storage = new Map<string, string>();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: (key: string, value: string | number | boolean) => {
        storage.set(key, String(value));
      },
      getString: (key: string) => storage.get(key),
      delete: (key: string) => {
        storage.delete(key);
      },
    })),
  };
});

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    seekTo: jest.fn(),
  })),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Heavy: 'heavy' },
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-confetti-cannon', () => 'ConfettiCannon');
