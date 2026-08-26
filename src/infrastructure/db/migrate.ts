import type { SQLiteDatabase } from 'expo-sqlite';

import { setDatabase } from './databaseRef';
import { CREATE_SCHEMA_SQL, DATABASE_VERSION } from './schema';

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  setDatabase(db);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(CREATE_SCHEMA_SQL);
  }

  if (currentVersion === 1) {
    await db.execAsync('ALTER TABLE words ADD COLUMN group_id TEXT');
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_words_group ON words(group_id) WHERE group_id IS NOT NULL',
    );
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
