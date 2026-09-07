import type { TurnEvent } from './types';

export function scoreForOutcome(outcome: 'guessed' | 'skipped', skipPenalty: 0 | -1): number {
  return outcome === 'guessed' ? 1 : skipPenalty;
}

export function reviewToggleDelta(): number {
  return -1;
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
    score = Math.max(0, score);
  }

  return score;
}

function eventsWithOverrides(
  events: TurnEvent[],
  overrides: Record<string, 'guessed' | 'skipped'>,
): TurnEvent[] {
  return events.map((event) => {
    if (event.kind !== 'guessed' && event.kind !== 'skipped') {
      return event;
    }

    const outcome = overrides[event.wordId];
    if (outcome == null || outcome === event.kind) {
      return event;
    }

    return { kind: outcome, wordId: event.wordId, at: event.at };
  });
}

/**
 * Returns the net score delta to apply to the acting team when review overrides change.
 */
export function applyReviewOverrides(
  events: TurnEvent[],
  overrides: Record<string, 'guessed' | 'skipped'>,
  skipPenalty: 0 | -1,
): number {
  return (
    computeTurnScore(eventsWithOverrides(events, overrides), skipPenalty) -
    computeTurnScore(events, skipPenalty)
  );
}

export function clampScore(score: number): number {
  return Math.max(0, score);
}
