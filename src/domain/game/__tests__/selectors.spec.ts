import { describe, expect, it } from '@jest/globals';

import {
  collectTurnEventsFromHistory,
  formatGuessDurationSeconds,
  selectMatchDurationMs,
  selectRecapCards,
  selectReviewBanner,
} from '@domain/game/selectors';
import type { CompletedTurn, RecapCard, Team } from '@domain/game/types';

function makeTeams(t1: number, t2: number): Team[] {
  return [
    {
      id: 't1',
      name: 'Блискавки',
      scores: { elias: t1, crocodile: 0, association: 0 },
    },
    {
      id: 't2',
      name: 'Капібари',
      scores: { elias: t2, crocodile: 0, association: 0 },
    },
  ];
}

function makeTurn(
  overrides: Partial<CompletedTurn> & Pick<CompletedTurn, 'events'>,
): CompletedTurn {
  return {
    teamId: 't1',
    roundIndex: 0,
    roundType: 'elias',
    startedAt: 0,
    endedAt: 60_000,
    ...overrides,
  };
}

function kinds(cards: RecapCard[]): RecapCard['kind'][] {
  return cards.map((card) => card.kind);
}

function cardOf<K extends RecapCard['kind']>(
  cards: RecapCard[],
  kind: K,
): Extract<RecapCard, { kind: K }> {
  const card = cards.find((entry): entry is Extract<RecapCard, { kind: K }> => entry.kind === kind);
  if (!card) {
    throw new Error(`missing recap card ${kind}`);
  }
  return card;
}

describe('domain/game/selectors', () => {
  const wordTexts = {
    'w-fast': 'швидко',
    'w-slow': 'повільно',
    'w-hard': 'квантова фізика',
  };

  it('omits fastest at an 8s sum and shows it at 7.9s without a team', () => {
    const omitted = selectRecapCards(
      [makeTurn({ events: [{ kind: 'guessed', wordId: 'w-fast', at: 8_000 }] })],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(kinds(omitted)).toEqual(['summary']);

    const shown = selectRecapCards(
      [makeTurn({ events: [{ kind: 'guessed', wordId: 'w-fast', at: 7_900 }] })],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(kinds(shown)).toEqual(['fastest', 'summary']);
    expect(cardOf(shown, 'fastest')).toEqual({
      kind: 'fastest',
      wordText: 'швидко',
      durationMs: 7_900,
    });
    expect(cardOf(shown, 'fastest')).not.toHaveProperty('teamName');
  });

  it('sums guess duration across rounds for the same word', () => {
    const history: CompletedTurn[] = [
      makeTurn({
        endedAt: 3_000,
        events: [{ kind: 'guessed', wordId: 'w-fast', at: 2_000 }],
      }),
      makeTurn({
        teamId: 't2',
        roundIndex: 1,
        roundType: 'crocodile',
        startedAt: 10_000,
        endedAt: 13_000,
        events: [{ kind: 'guessed', wordId: 'w-fast', at: 12_000 }],
      }),
      makeTurn({
        roundIndex: 2,
        roundType: 'association',
        startedAt: 20_000,
        endedAt: 22_500,
        events: [{ kind: 'guessed', wordId: 'w-fast', at: 22_500 }],
      }),
    ];

    const cards = selectRecapCards(history, makeTeams(10, 4), wordTexts, 0);
    expect(cardOf(cards, 'fastest').durationMs).toBe(6_500);
  });

  it('omits slowest below 25s and shows it at 25s', () => {
    const omitted = selectRecapCards(
      [makeTurn({ events: [{ kind: 'guessed', wordId: 'w-slow', at: 24_999 }] })],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(kinds(omitted)).toEqual(['summary']);

    const shown = selectRecapCards(
      [makeTurn({ events: [{ kind: 'guessed', wordId: 'w-slow', at: 25_000 }] })],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(cardOf(shown, 'slowest')).toEqual({
      kind: 'slowest',
      wordText: 'повільно',
      durationMs: 25_000,
    });
  });

  it('hardest word uses first resolution including award and ignores later skips', () => {
    const history: CompletedTurn[] = [
      makeTurn({
        events: [
          { kind: 'skipped', wordId: 'w-hard', at: 1_000 },
          { kind: 'skipped', wordId: 'w-hard', at: 2_000 },
          { kind: 'awarded', wordId: 'w-hard', toTeamId: 't2', at: 3_000 },
        ],
      }),
      makeTurn({
        teamId: 't2',
        roundIndex: 1,
        roundType: 'crocodile',
        startedAt: 10_000,
        endedAt: 20_000,
        events: [
          { kind: 'skipped', wordId: 'w-hard', at: 11_000 },
          { kind: 'guessed', wordId: 'w-hard', at: 12_000 },
        ],
      }),
    ];

    const cards = selectRecapCards(history, makeTeams(10, 4), wordTexts, 0);
    expect(cardOf(cards, 'hardest')).toEqual({
      kind: 'hardest',
      wordText: 'квантова фізика',
      skipsBeforeFirst: 2,
      attemptIndex: 3,
    });
  });

  it('omits hardest when fewer than 2 skips before first resolution', () => {
    const cards = selectRecapCards(
      [
        makeTurn({
          events: [
            { kind: 'skipped', wordId: 'w-hard', at: 1_000 },
            { kind: 'guessed', wordId: 'w-hard', at: 20_000 },
          ],
        }),
      ],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(kinds(cards)).toEqual(['summary']);
  });

  it('shows close at gap 2, blowout at 10, and omits 0 and 7', () => {
    const history = [makeTurn({ events: [{ kind: 'guessed', wordId: 'w-fast', at: 20_000 }] })];

    expect(kinds(selectRecapCards(history, makeTeams(31, 29), wordTexts, 0))[0]).toBe('close_game');
    expect(cardOf(selectRecapCards(history, makeTeams(31, 29), wordTexts, 0), 'close_game').gap).toBe(
      2,
    );
    expect(kinds(selectRecapCards(history, makeTeams(42, 19), wordTexts, 0))[0]).toBe('blowout');
    expect(kinds(selectRecapCards(history, makeTeams(30, 30), wordTexts, 0))).toEqual(['summary']);
    expect(kinds(selectRecapCards(history, makeTeams(20, 13), wordTexts, 0))).toEqual(['summary']);
  });

  it('summary is always last and counts awards to a team as guessed', () => {
    const history = [
      makeTurn({
        endedAt: 40_000,
        events: [
          { kind: 'guessed', wordId: 'w-fast', at: 10_000 },
          { kind: 'skipped', wordId: 'w-hard', at: 12_000 },
          { kind: 'awarded', wordId: 'w-slow', toTeamId: 't2', at: 20_000 },
          { kind: 'awarded', wordId: 'w-miss', toTeamId: null, at: 30_000 },
        ],
      }),
    ];

    const cards = selectRecapCards(history, makeTeams(10, 4), wordTexts, 5_000);
    expect(cards.at(-1)).toEqual({
      kind: 'summary',
      durationMs: 35_000,
      guessedCount: 2,
      skippedCount: 1,
      turnCount: 1,
    });
  });

  it('ranks blowout first, then middle cards by threshold units, summary last', () => {
    const guessed = (wordId: string, at: number) => ({ kind: 'guessed' as const, wordId, at });

    const bestTurnEvents = Array.from({ length: 10 }, (_, index) =>
      guessed(`w-${index + 1}`, (index + 1) * 100),
    );

    const history: CompletedTurn[] = [
      makeTurn({
        endedAt: 2_000,
        events: bestTurnEvents,
      }),
      makeTurn({
        startedAt: 10_000,
        endedAt: 21_000,
        events: [
          { kind: 'skipped', wordId: 'w-hard', at: 10_100 },
          { kind: 'skipped', wordId: 'w-hard', at: 10_200 },
          { kind: 'skipped', wordId: 'w-hard', at: 10_300 },
          { kind: 'skipped', wordId: 'w-hard', at: 10_400 },
          { kind: 'skipped', wordId: 'w-hard', at: 10_500 },
          { kind: 'skipped', wordId: 'w-hard', at: 10_600 },
          guessed('w-hard', 20_000),
        ],
      }),
      makeTurn({
        startedAt: 30_000,
        endedAt: 71_000,
        events: [guessed('w-slow', 70_000)],
      }),
    ];

    const cards = selectRecapCards(history, makeTeams(42, 19), wordTexts, 0);
    expect(kinds(cards)).toEqual([
      'blowout',
      'fastest',
      'best_turn',
      'hardest',
      'slowest',
      'summary',
    ]);
  });

  it('tie-breaks equal middle scores hardest then fastest then slowest then best-turn', () => {
    const history: CompletedTurn[] = [
      makeTurn({
        events: [
          { kind: 'skipped', wordId: 'w-hard', at: 100 },
          { kind: 'skipped', wordId: 'w-hard', at: 200 },
          { kind: 'skipped', wordId: 'w-hard', at: 300 },
          { kind: 'skipped', wordId: 'w-hard', at: 400 },
          { kind: 'guessed', wordId: 'w-hard', at: 10_400 },
          { kind: 'guessed', wordId: 'w-fast', at: 16_400 },
        ],
      }),
    ];

    const cards = selectRecapCards(history, makeTeams(10, 4), wordTexts, 0);
    expect(kinds(cards)).toEqual(['hardest', 'fastest', 'summary']);
  });

  it('best turn uses max per turn, not team-round aggregate, and omits under 5 guesses', () => {
    const omitted = selectRecapCards(
      [
        makeTurn({
          events: [
            { kind: 'guessed', wordId: 'w1', at: 100 },
            { kind: 'guessed', wordId: 'w2', at: 200 },
            { kind: 'guessed', wordId: 'w3', at: 300 },
            { kind: 'guessed', wordId: 'w4', at: 400 },
          ],
        }),
      ],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(kinds(omitted)).not.toContain('best_turn');

    const shown = selectRecapCards(
      [
        makeTurn({
          events: [
            { kind: 'guessed', wordId: 'w1', at: 100 },
            { kind: 'guessed', wordId: 'w2', at: 200 },
            { kind: 'guessed', wordId: 'w3', at: 300 },
            { kind: 'guessed', wordId: 'w4', at: 400 },
            { kind: 'guessed', wordId: 'w5', at: 500 },
          ],
        }),
      ],
      makeTeams(10, 4),
      wordTexts,
      0,
    );
    expect(cardOf(shown, 'best_turn')).toEqual({
      kind: 'best_turn',
      teamName: 'Блискавки',
      totalWordsGuessed: 5,
    });
  });

  it('formatGuessDurationSeconds rounds sub-second guesses to at least 1 second', () => {
    expect(formatGuessDurationSeconds(0)).toBe(0);
    expect(formatGuessDurationSeconds(400)).toBe(1);
    expect(formatGuessDurationSeconds(1_500)).toBe(2);
  });

  it('selectMatchDurationMs uses last turn end minus createdAt', () => {
    const history = [
      makeTurn({ startedAt: 1_000, endedAt: 70_000, events: [] }),
      makeTurn({ teamId: 't2', startedAt: 80_000, endedAt: 100_000, events: [] }),
    ];
    expect(selectMatchDurationMs(history, 0)).toBe(100_000);
    expect(selectMatchDurationMs(history, 20_000)).toBe(80_000);
    expect(selectMatchDurationMs([], 0)).toBeNull();
  });

  it('collectTurnEventsFromHistory flattens completed turns', () => {
    const history = [
      makeTurn({
        events: [
          { kind: 'guessed', wordId: 'w-fast', at: 5_000 },
          { kind: 'skipped', wordId: 'w-hard', at: 10_000 },
        ],
      }),
    ];
    expect(collectTurnEventsFromHistory(history)).toHaveLength(2);
  });

  it('selectReviewBanner is null outside review', () => {
    expect(selectReviewBanner({ status: 'idle' } as never)).toBeNull();
  });
});
