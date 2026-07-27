import type { SQLiteDatabase } from 'expo-sqlite';

import { getAppVersion } from '@shared/lib/appVersion';

import { clearActiveMatch } from '../storage/activeMatch';
import { mmkv } from '../storage/mmkv';

import { migrateDbIfNeeded } from './migrate';
import { clearWordsCache } from './words.repo';

export const WORDS_DB_APP_VERSION_KEY = 'kapelyukh.wordsDbAppVersion';

export function shouldForceOverwriteWordsDb(): boolean {
  const storedVersion = mmkv.getString(WORDS_DB_APP_VERSION_KEY);
  return storedVersion !== getAppVersion();
}

export function markWordsDbSynced(): void {
  mmkv.set(WORDS_DB_APP_VERSION_KEY, getAppVersion());
}

export function clearStaleGameDataAfterWordsDbOverwrite(): void {
  clearActiveMatch();
  clearWordsCache();
}

export async function initializeWordsDatabase(
  db: SQLiteDatabase,
  forceOverwrite: boolean,
): Promise<void> {
  await migrateDbIfNeeded(db);

  if (!forceOverwrite) {
    return;
  }

  clearStaleGameDataAfterWordsDbOverwrite();
  markWordsDbSynced();
}

export function clearWordsDbSyncStamp(): void {
  mmkv.delete(WORDS_DB_APP_VERSION_KEY);
}
