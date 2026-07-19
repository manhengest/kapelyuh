import { describe, expect, it } from '@jest/globals';

import {
  collectTurnEventsFromHistory,
  formatGuessDurationSeconds,
  selectMatchStatCardCount,
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

  it('selectMatchStats identifies the best single turn by guesses', () => {
    const stats = selectMatchStats(turnHistory, teams, wordTexts);

    expect(stats.bestTurn?.totalWordsGuessed).toBe(2);
    expect(stats.bestTurn?.teamName).toBe('Команда 1');
  });

  it('selectMatchStats best turn uses max per turn, not team-round aggregate', () => {
    const multiTurnHistory: CompletedTurn[] = [
      {
        teamId: 't1',
        roundIndex: 0,
        roundType: 'elias',
        startedAt: 0,
        endedAt: 1_000,
        events: [
          { kind: 'guessed', wordId: 'w1', at: 100 },
          { kind: 'guessed', wordId: 'w2', at: 200 },
          { kind: 'guessed', wordId: 'w3', at: 300 },
        ],
      },
      {
        teamId: 't1',
        roundIndex: 0,
        roundType: 'elias',
        startedAt: 2_000,
        endedAt: 3_000,
        events: [
          { kind: 'guessed', wordId: 'w4', at: 2_100 },
          { kind: 'guessed', wordId: 'w5', at: 2_200 },
          { kind: 'guessed', wordId: 'w6', at: 2_300 },
          { kind: 'guessed', wordId: 'w7', at: 2_400 },
          { kind: 'guessed', wordId: 'w8', at: 2_500 },
        ],
      },
    ];

    const stats = selectMatchStats(multiTurnHistory, teams, wordTexts);

    expect(stats.bestTurn?.totalWordsGuessed).toBe(5);
    expect(stats.bestTurn?.teamName).toBe('Команда 1');
  });

  it('formatGuessDurationSeconds rounds sub-second guesses to at least 1 second', () => {
    expect(formatGuessDurationSeconds(0)).toBe(0);
    expect(formatGuessDurationSeconds(400)).toBe(1);
    expect(formatGuessDurationSeconds(1_500)).toBe(2);
  });

  it('selectMatchStatCardCount matches available stat slides', () => {
    const stats = selectMatchStats(turnHistory, teams, wordTexts);
    expect(selectMatchStatCardCount(stats)).toBe(3);
    expect(selectMatchStatCardCount({ ...stats, fastestGuess: null, mostSkippedWord: null })).toBe(
      1,
    );
  });

  it('collectTurnEventsFromHistory flattens completed turns', () => {
    expect(collectTurnEventsFromHistory(turnHistory)).toHaveLength(5);
  });

  it('selectReviewBanner is null outside review', () => {
    expect(selectReviewBanner({ status: 'idle' } as never)).toBeNull();
  });
});
