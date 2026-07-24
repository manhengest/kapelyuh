import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { getSettings } from '@infrastructure/storage/settings';

let initialized = false;

export function getSentryRelease(): { release: string; dist: string } {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const dist = Constants.expoConfig?.ios?.buildNumber ?? '0';
  return { release: `kapelyukh@${version}`, dist };
}

export function initSentry(): void {
  if (initialized) {
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const settings = getSettings();
  const { release, dist } = getSentryRelease();

  Sentry.init({
    dsn,
    enabled: Boolean(dsn) && settings.sentryEnabled,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    release,
    dist,
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
  });

  initialized = true;
}

export function setSentryEnabled(enabled: boolean): void {
  const client = Sentry.getClient();
  if (client) {
    client.getOptions().enabled = Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN) && enabled;
  }
}

export function captureException(error: unknown): void {
  Sentry.captureException(error);
}

export { Sentry };
