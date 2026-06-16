import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized) {
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    debug: __DEV__,
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
  });

  initialized = true;
}

export function captureException(error: unknown): void {
  Sentry.captureException(error);
}

export { Sentry };
