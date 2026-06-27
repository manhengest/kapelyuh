import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type UseAppStatePauseOptions = {
  enabled: boolean;
  onBackground: () => void;
  onForeground: () => void;
};

export function useAppStatePause({ enabled, onBackground, onForeground }: UseAppStatePauseOptions) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        onBackground();
      }

      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        onForeground();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [enabled, onBackground, onForeground]);
}
