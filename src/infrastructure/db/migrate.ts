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

  if (currentVersion === 1 || currentVersion === 2) {
    await db.execAsync('PRAGMA foreign_keys = OFF');
    await db.execAsync(`
CREATE TABLE words_new (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','elite')),
  category_id TEXT NOT NULL,
  group_id TEXT
)`);
    await db.execAsync(`
INSERT INTO words_new (id, pack_id, text, difficulty, category_id, group_id)
SELECT id, pack_id, text, difficulty, category_id, group_id FROM words`);
    await db.execAsync('DROP TABLE words');
    await db.execAsync('ALTER TABLE words_new RENAME TO words');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_words_pack ON words(pack_id)');
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_words_group ON words(group_id) WHERE group_id IS NOT NULL',
    );
    await db.execAsync('PRAGMA foreign_keys = ON');
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
