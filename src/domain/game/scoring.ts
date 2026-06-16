import type { TurnEvent } from './types';

export function scoreForOutcome(outcome: 'guessed' | 'skipped', skipPenalty: 0 | -1): number {
  return outcome === 'guessed' ? 1 : skipPenalty;
}

export function reviewToggleDelta(skipPenalty: 0 | -1): number {
  return -(1 - skipPenalty);
}

export function deriveWordOutcome(
  events: TurnEvent[],
  wordId: string,
): 'guessed' | 'skipped' | 'awarded' | 'none' {
  let outcome: 'guessed' | 'skipped' | 'awarded' | 'none' = 'none';

  for (const event of events) {
    if (event.kind === 'guessed' && event.wordId === wordId) {
      outcome = 'guessed';
    }
    if (event.kind === 'skipped' && event.wordId === wordId) {
      outcome = 'skipped';
    }
    if (event.kind === 'awarded' && event.wordId === wordId) {
      outcome = 'awarded';
    }
  }

  return outcome;
}

export function getTurnWordIds(events: TurnEvent[], pendingWordId: string | null): string[] {
  const ids = new Set<string>();

  for (const event of events) {
    if (event.kind === 'guessed' || event.kind === 'skipped' || event.kind === 'awarded') {
      ids.add(event.wordId);
    }
    if (event.kind === 'expired' && event.pendingWordId) {
      ids.add(event.pendingWordId);
    }
  }

  if (pendingWordId) {
    ids.add(pendingWordId);
  }

  return [...ids];
}

export function computeTurnScore(events: TurnEvent[], skipPenalty: 0 | -1): number {
  let score = 0;

  for (const event of events) {
    if (event.kind === 'guessed') {
      score += 1;
    }
    if (event.kind === 'skipped') {
      score += skipPenalty;
    }
  }

  return score;
}

/**
 * Returns the net score delta to apply to the acting team when review overrides change.
 */
export function applyReviewOverrides(
  events: TurnEvent[],
  overrides: Record<string, 'guessed' | 'skipped'>,
  skipPenalty: 0 | -1,
): number {
  const wordIds = getTurnWordIds(events, null);
  let delta = 0;

  for (const wordId of wordIds) {
    const original = deriveWordOutcome(events, wordId);
    if (original === 'awarded' || original === 'none') {
      continue;
    }

    const finalOutcome = overrides[wordId] ?? original;
    const originalScore = scoreForOutcome(original, skipPenalty);
    const finalScore = scoreForOutcome(finalOutcome, skipPenalty);
    delta += finalScore - originalScore;
  }

  return delta;
}

export function clampScore(score: number): number {
  return Math.max(0, score);
}
