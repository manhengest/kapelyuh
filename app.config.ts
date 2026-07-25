import type { ExpoConfig } from 'expo/config';

import packageJson from './package.json';

const APP_VERSION = process.env.APP_VERSION ?? packageJson.version;

export default (): ExpoConfig =>
  ({
    name: 'Капелюх',
    slug: 'kapelyuh',
    version: APP_VERSION,
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'kapelyukh',
    userInterfaceStyle: 'automatic',
    backgroundColor: '#000000',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.kapelyukh.app',
      buildNumber: '1',
      deploymentTarget: '17.6.1',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.kapelyukh.app',
      adaptiveIcon: {
        backgroundColor: '#F5E0C8',
        foregroundImage: './assets/images/logo.png',
      },
    },
    plugins: [
      'expo-router',
      'expo-dev-client',
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          organization: 'khodzinskyi-vv',
          project: 'react-native',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#000000',
        },
      ],
      'expo-sqlite',
      'expo-asset',
      '@sentry/react-native',
      'expo-audio',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '2c087e96-1a06-4239-bf7f-60ca619d0781',
      },
    },
    owner: 'khodzinskyi-vv',
  }) as ExpoConfig;
