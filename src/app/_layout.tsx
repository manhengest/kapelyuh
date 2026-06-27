import '../../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GameRouteSync, useHydrateGameStore } from '@features/game/navigation';
import { useSettingsStore } from '@features/settings/store';
import { initSentry } from '@infrastructure/analytics/sentry';
import { initSounds } from '@infrastructure/audio/sounds';
import { migrateDbIfNeeded } from '@infrastructure/db/migrate';
import { ThemeSync } from '@shared/hooks/ThemeSync';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useHydrateGameStore();
  const hydrateSettings = useSettingsStore((store) => store.hydrate);
  const settingsHydrated = useSettingsStore((store) => store.hydrated);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    if (!settingsHydrated) {
      return;
    }
    initSentry();
    void initSounds();
    void SplashScreen.hideAsync();
  }, [settingsHydrated]);

  return (
    <SQLiteProvider
      databaseName="kapelyukh.db"
      assetSource={{ assetId: require('../../assets/data/kapelyukh.db') }}
      onInit={migrateDbIfNeeded}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeSync />
        <GameRouteSync />
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </SQLiteProvider>
  );
}
