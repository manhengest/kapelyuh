import { beforeEach, describe, expect, it } from '@jest/globals';

import { makeSettings, makeTeam } from '@domain/game/__tests__/helpers';
import { createInitialState } from '@domain/game/reducer';
import type { GameState } from '@domain/game/types';
import { setDatabase } from '@infrastructure/db/databaseRef';
import {
  getRecentSessionWordIds,
  pruneOldSessions,
  saveFinishedSession,
} from '@infrastructure/db/sessions.repo';
import { getAllWords, getWordTextMap, clearWordsCache } from '@infrastructure/db/words.repo';


import { createBetterSqliteAdapter, createTestDatabase, seedTestWords } from './testDb';

function finishedState(sessionWordIds: string[], updatedAt: number): GameState {
  return {
    ...createInitialState(updatedAt - 500),
    status: 'end_of_match',
    settings: makeSettings({ wordCount: sessionWordIds.length }),
    teams: [makeTeam('t1', 'A'), makeTeam('t2', 'B')],
    rounds: [
      {
        type: 'elias',
        sessionWordIds,
        remainingWordIds: [],
        guessedWordIds: sessionWordIds,
        turnIndex: 0,
      },
    ],
    currentRoundIndex: 2,
    statCardsRemaining: 0,
    updatedAt,
  };
}

function setupDb() {
  const sqlite = createTestDatabase();
  seedTestWords(sqlite, [
    { id: 'w-1', text: 'капелюх', difficulty: 'easy' },
    { id: 'w-2', text: 'слон', difficulty: 'easy' },
    { id: 'w-3', text: 'книга', difficulty: 'medium' },
    { id: 'w-4', text: 'ентропія', difficulty: 'hard' },
  ]);
  setDatabase(createBetterSqliteAdapter(sqlite));
  clearWordsCache();
  return sqlite;
}

describe('infrastructure/db/words.repo', () => {
  beforeEach(() => {
    setupDb();
  });

  it('loads bundled words and builds a text map', async () => {
    const words = await getAllWords(['bundled-default']);
    expect(words).toHaveLength(4);
    expect(words[0]?.text).toBe('капелюх');

    const map = await getWordTextMap();
    expect(map['w-2']).toBe('слон');
  });
});

describe('infrastructure/db/sessions.repo', () => {
  beforeEach(() => {
    setupDb();
  });

  it('saves finished sessions and returns recent word ids', async () => {
    await saveFinishedSession(finishedState(['w-1', 'w-2', 'w-3'], 1_500));
    const recent = await getRecentSessionWordIds(3);
    expect(recent).toEqual(expect.arrayContaining(['w-1', 'w-2', 'w-3']));
  });

  it('prunes sessions beyond the keep limit', async () => {
    for (let index = 0; index < 22; index += 1) {
      await saveFinishedSession(finishedState([`w-${index}`], index * 1_000 + 500));
    }

    await pruneOldSessions(20);
    const recent = await getRecentSessionWordIds(25);
    expect(recent.length).toBeLessThanOrEqual(20);
  });
});
