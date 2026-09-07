import { describe, expect, it } from '@jest/globals';

import {
  applyReviewOverrides,
  clampScore,
  computeTurnScore,
  deriveWordOutcome,
  reviewToggleDelta,
  scoreForOutcome,
} from '@domain/game/scoring';
import type { TurnEvent } from '@domain/game/types';

describe('domain/game/scoring', () => {
  it('scores guessed words as +1 and skipped words by penalty', () => {
    expect(scoreForOutcome('guessed', 0)).toBe(1);
    expect(scoreForOutcome('skipped', 0)).toBe(0);
    expect(scoreForOutcome('skipped', -1)).toBe(-1);
  });

  it('computes review toggle delta as -1 regardless of skip penalty', () => {
    expect(reviewToggleDelta()).toBe(-1);
  });

  it('clamps team totals to zero', () => {
    expect(clampScore(-3)).toBe(0);
    expect(clampScore(4)).toBe(4);
  });

  it('derives the final outcome for a word from turn events', () => {
    const events: TurnEvent[] = [
      { kind: 'skipped', wordId: 'w1', at: 1 },
      { kind: 'guessed', wordId: 'w2', at: 2 },
      { kind: 'awarded', wordId: 'w3', toTeamId: 't1', at: 3 },
    ];

    expect(deriveWordOutcome(events, 'w1')).toBe('skipped');
    expect(deriveWordOutcome(events, 'w2')).toBe('guessed');
    expect(deriveWordOutcome(events, 'w3')).toBe('awarded');
  });

  it('computes live turn score from guess and skip events', () => {
    const events: TurnEvent[] = [
      { kind: 'guessed', wordId: 'w1', at: 1 },
      { kind: 'skipped', wordId: 'w2', at: 2 },
      { kind: 'guessed', wordId: 'w3', at: 3 },
    ];

    expect(computeTurnScore(events, 0)).toBe(2);
    expect(computeTurnScore(events, -1)).toBe(1);
  });

  it('floors skip penalty at zero so early skips do not debt later guesses', () => {
    const earlySkips: TurnEvent[] = [
      { kind: 'skipped', wordId: 'w1', at: 1 },
      { kind: 'skipped', wordId: 'w2', at: 2 },
      { kind: 'guessed', wordId: 'w3', at: 3 },
      { kind: 'guessed', wordId: 'w4', at: 4 },
      { kind: 'guessed', wordId: 'w5', at: 5 },
      { kind: 'guessed', wordId: 'w6', at: 6 },
      { kind: 'guessed', wordId: 'w7', at: 7 },
    ];
    const lateSkips: TurnEvent[] = [
      { kind: 'guessed', wordId: 'w1', at: 1 },
      { kind: 'guessed', wordId: 'w2', at: 2 },
      { kind: 'guessed', wordId: 'w3', at: 3 },
      { kind: 'guessed', wordId: 'w4', at: 4 },
      { kind: 'guessed', wordId: 'w5', at: 5 },
      { kind: 'skipped', wordId: 'w6', at: 6 },
      { kind: 'skipped', wordId: 'w7', at: 7 },
    ];
    const guessThenSkip: TurnEvent[] = [
      { kind: 'guessed', wordId: 'w1', at: 1 },
      { kind: 'skipped', wordId: 'w2', at: 2 },
    ];

    expect(computeTurnScore(earlySkips, -1)).toBe(5);
    expect(computeTurnScore(lateSkips, -1)).toBe(3);
    expect(computeTurnScore(guessThenSkip, -1)).toBe(0);
  });

  it('applyReviewOverrides returns symmetric toggle deltas', () => {
    const events: TurnEvent[] = [
      { kind: 'guessed', wordId: 'w1', at: 1 },
      { kind: 'skipped', wordId: 'w2', at: 2 },
    ];

    expect(applyReviewOverrides(events, { w1: 'skipped' }, 0)).toBe(-1);
    expect(applyReviewOverrides(events, { w1: 'skipped' }, -1)).toBe(0);
    expect(applyReviewOverrides(events, { w2: 'guessed' }, 0)).toBe(1);
    expect(applyReviewOverrides(events, { w2: 'guessed' }, -1)).toBe(2);
  });

  it('review foul of a guess already eaten by a later skip does not change the turn score', () => {
    const events: TurnEvent[] = [
      { kind: 'guessed', wordId: 'w1', at: 1 },
      { kind: 'skipped', wordId: 'w2', at: 2 },
      { kind: 'guessed', wordId: 'w3', at: 3 },
    ];

    expect(computeTurnScore(events, -1)).toBe(1);
    expect(applyReviewOverrides(events, { w1: 'skipped' }, -1)).toBe(0);
  });

  it('ignores awarded words when applying review overrides', () => {
    const events: TurnEvent[] = [
      { kind: 'expired', at: 1, pendingWordId: 'w1' },
      { kind: 'awarded', wordId: 'w1', toTeamId: 't2', at: 2 },
    ];

    expect(applyReviewOverrides(events, { w1: 'skipped' }, -1)).toBe(0);
  });
});
