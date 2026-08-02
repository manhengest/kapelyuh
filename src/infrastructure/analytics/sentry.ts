import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { getSettings } from '@infrastructure/storage/settings';
import { getAppVersion } from '@shared/lib/appVersion';

let initialized = false;

export function getSentryRelease(): { release: string; dist: string } {
  const version = getAppVersion();
  const dist = Constants.expoConfig?.ios?.buildNumber ?? '0';
  return { release: `kapelyukh@${version}`, dist };
}

function isSentryAllowed(): boolean {
  return !__DEV__ && Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);
}

export function initSentry(): void {
  if (initialized) {
    return;
  }

  const settings = getSettings();
  const { release, dist } = getSentryRelease();

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: isSentryAllowed() && settings.sentryEnabled,
    debug: false,
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
    client.getOptions().enabled = isSentryAllowed() && enabled;
  }
}

export function captureException(error: unknown): void {
  Sentry.captureException(error);
}

export { Sentry };
