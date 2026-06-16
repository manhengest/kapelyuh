import { describe, expect, it } from '@jest/globals';

import {
  collectTurnEventsFromHistory,
  selectMatchStats,
  selectReviewBanner,
} from '@domain/game/selectors';
import type { CompletedTurn, Team } from '@domain/game/types';

describe('domain/game/selectors', () => {
  const teams: Team[] = [
    {
      id: 't1',
      name: 'Команда 1',
      scores: { elias: 2, crocodile: 0, association: 0 },
    },
    {
      id: 't2',
      name: 'Команда 2',
      scores: { elias: 1, crocodile: 0, association: 0 },
    },
  ];

  const turnHistory: CompletedTurn[] = [
    {
      teamId: 't1',
      roundIndex: 0,
      roundType: 'elias',
      startedAt: 1_000,
      endedAt: 70_000,
      events: [
        { kind: 'guessed', wordId: 'w-fast', at: 5_000 },
        { kind: 'skipped', wordId: 'w-skip', at: 10_000 },
        { kind: 'guessed', wordId: 'w-slow', at: 60_000 },
      ],
    },
    {
      teamId: 't2',
      roundIndex: 0,
      roundType: 'elias',
      startedAt: 80_000,
      endedAt: 100_000,
      events: [
        { kind: 'guessed', wordId: 'w-fast', at: 90_000 },
        { kind: 'guessed', wordId: 'w-slow', at: 95_000 },
      ],
    },
  ];

  const wordTexts = {
    'w-fast': 'швидко',
    'w-slow': 'повільно',
    'w-skip': 'пропуск',
  };

  it('selectMatchStats surfaces fastest and slowest guesses', () => {
    const stats = selectMatchStats(turnHistory, teams, wordTexts);

    expect(stats.fastestGuess).toEqual({ wordText: 'швидко', durationMs: 4_000 });
    expect(stats.slowestGuess).toEqual({ wordText: 'повільно', durationMs: 50_000 });
  });

  it('selectMatchStats finds the least skipped team and most skipped word', () => {
    const stats = selectMatchStats(turnHistory, teams, wordTexts);

    expect(stats.leastSkippedTeam).toEqual({ teamName: 'Команда 2', skipCount: 0 });
    expect(stats.mostSkippedWord).toEqual({ wordText: 'пропуск', skipCount: 1 });
  });

  it('selectMatchStats identifies the best team round by guesses', () => {
    const stats = selectMatchStats(turnHistory, teams, wordTexts);

    expect(stats.bestRound?.totalWordsGuessed).toBe(2);
    expect(stats.bestRound?.teamNames).toContain('Команда 1');
  });

  it('collectTurnEventsFromHistory flattens completed turns', () => {
    expect(collectTurnEventsFromHistory(turnHistory)).toHaveLength(5);
  });

  it('selectReviewBanner is null outside review', () => {
    expect(selectReviewBanner({ status: 'idle' } as never)).toBeNull();
  });
});
