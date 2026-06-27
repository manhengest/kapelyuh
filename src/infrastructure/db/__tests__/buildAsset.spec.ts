
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from '@jest/globals';
import Database from 'better-sqlite3';

import { MIN_WORD_COUNT } from '@infrastructure/db/schema';

describe('bundled kapelyukh.db asset', () => {
  it('contains the launch word pack with enough words', () => {
    const dbPath = join(process.cwd(), 'assets/data/kapelyukh.db');
    expect(existsSync(dbPath)).toBe(true);

    const db = new Database(dbPath, { readonly: true });
    const wordCount = db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };
    const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number };
    db.close();

    expect(packCount.count).toBe(1);
    expect(wordCount.count).toBeGreaterThanOrEqual(MIN_WORD_COUNT);
  });
});
