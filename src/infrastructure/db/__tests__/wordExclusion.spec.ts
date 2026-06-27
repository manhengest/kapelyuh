import { beforeEach, describe, expect, it } from '@jest/globals';

import type { Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';
import { setDatabase } from '@infrastructure/db/databaseRef';
import { getRecentSessionWordIds } from '@infrastructure/db/sessions.repo';
import { clearWordsCache } from '@infrastructure/db/words.repo';

import { createBetterSqliteAdapter, createTestDatabase, seedTestWords } from './testDb';

const WORDS: Word[] = Array.from({ length: 10 }, (_, index) => ({
  id: `w-${index + 1}`,
  text: `word-${index + 1}`,
  difficulty: 'easy',
  categoryId: 'test',
  packId: 'bundled-default',
}));

describe('session word exclusion integration', () => {
  beforeEach(() => {
    const sqlite = createTestDatabase();
    seedTestWords(
      sqlite,
      WORDS.map((word) => ({ id: word.id, text: word.text, difficulty: word.difficulty })),
    );
    setDatabase(createBetterSqliteAdapter(sqlite));
    clearWordsCache();
  });

  it('excludes words from recent finished sessions when selecting a new match', async () => {
    const sqlite = createTestDatabase();
    seedTestWords(
      sqlite,
      WORDS.map((word) => ({ id: word.id, text: word.text, difficulty: word.difficulty })),
    );
    const adapter = createBetterSqliteAdapter(sqlite);
    setDatabase(adapter);

    await adapter.runAsync(
      `INSERT INTO sessions (id, finished_at, duration_ms, payload_json, word_ids_json)
       VALUES (?, ?, ?, ?, ?)`,
      'session-1',
      Date.now(),
      1000,
      '{}',
      JSON.stringify(['w-1', 'w-2', 'w-3']),
    );

    const excluded = await getRecentSessionWordIds(3);
    const selected = selectSessionWords({
      words: WORDS,
      difficulties: ['easy'],
      wordCount: 3,
      excludedWordIds: excluded,
      enabledPackIds: ['bundled-default'],
    });

    expect(selected).not.toContain('w-1');
    expect(selected).not.toContain('w-2');
    expect(selected).not.toContain('w-3');
    expect(selected).toHaveLength(3);
  });
});
