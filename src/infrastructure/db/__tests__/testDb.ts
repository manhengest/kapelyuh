import Database from 'better-sqlite3';

import {
  BUNDLED_PACK_ID,
  BUNDLED_PACK_NAME,
  CREATE_SCHEMA_SQL,
  DATABASE_VERSION,
} from '@infrastructure/db/schema';

export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.exec(CREATE_SCHEMA_SQL);
  db.exec(`PRAGMA user_version = ${DATABASE_VERSION}`);
  return db;
}

export function seedTestWords(db: Database.Database, words: { id: string; text: string; difficulty: string }[]): void {
  db.prepare(
    'INSERT INTO packs (id, name, source, created_at) VALUES (?, ?, ?, ?)',
  ).run(BUNDLED_PACK_ID, BUNDLED_PACK_NAME, 'bundled', Date.now());

  const insert = db.prepare(
    'INSERT INTO words (id, pack_id, text, difficulty, category_id) VALUES (?, ?, ?, ?, ?)',
  );

  for (const word of words) {
    insert.run(word.id, BUNDLED_PACK_ID, word.text, word.difficulty, 'test');
  }
}

export function createBetterSqliteAdapter(db: Database.Database) {
  return {
    async execAsync(sql: string): Promise<void> {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: unknown[]): Promise<void> {
      db.prepare(sql).run(...params);
    },
    async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
      return db.prepare(sql).all(...params) as T[];
    },
  };
}
