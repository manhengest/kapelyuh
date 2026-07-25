import Constants from 'expo-constants';

import packageJson from '../../../package.json';

export const APP_VERSION = packageJson.version;

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? APP_VERSION;
}
