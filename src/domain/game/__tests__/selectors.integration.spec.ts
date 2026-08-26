import { describe, expect, it } from '@jest/globals';

import {
  selectCurrentTeam,
  selectIsHatEmpty,
  selectRemainingWordCount,
  selectRemainingWords,
  selectReviewCta,
  selectScoreboard,
  selectWinners,
} from '@domain/game/selectors';
import type { Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';

import { awardWord, expireTimer, guessCurrentWord, makeTeam, startMatch } from './helpers';

describe('domain/game/selectors integration', () => {
  it('selectCurrentTeam returns the active team', () => {
    const state = startMatch(['w1', 'w2']);
    expect(selectCurrentTeam(state)?.id).toBe('t1');
  });

  it('selectRemainingWords includes the active card and queued words', () => {
    const state = startMatch(['w1', 'w2', 'w3']);

    const remaining = selectRemainingWords(state, { w1: 'один', w2: 'два', w3: 'три' });

    expect(remaining).toHaveLength(3);
    expect(remaining[0]?.text).toBeTruthy();
  });

  it('selectRemainingWordCount tracks queue plus active card', () => {
    const state = startMatch(['w1', 'w2']);

    expect(selectRemainingWordCount(state)).toBe(2);
  });

  it('selectScoreboard and selectWinners derive totals from team scores', () => {
    let state = startMatch(['w1', 'w2'], [makeTeam('t1', 'А'), makeTeam('t2', 'Б')]);

    state = guessCurrentWord(state);

    const board = selectScoreboard(state);
    expect(board[0]?.total).toBe(1);
    expect(selectWinners(state).map((team) => team.id)).toEqual(['t1']);
  });

  it('selectReviewCta returns next_turn while words remain', () => {
    let state = startMatch(['w1', 'w2', 'w3']);

    state = guessCurrentWord(state);
    state = expireTimer(state);
    state = awardWord(state, null);

    expect(selectIsHatEmpty(state)).toBe(false);
    expect(selectReviewCta(state)).toBe('next_turn');
  });
});

describe('selectSessionWords freshness', () => {
  it('prefers unused words when usage is provided', () => {
    const words: Word[] = [
      {
        id: 'w1',
        text: 'alpha',
        difficulty: 'easy',
        categoryId: 'c',
        packId: 'bundled-default',
      },
      {
        id: 'w2',
        text: 'beta',
        difficulty: 'easy',
        categoryId: 'c',
        packId: 'bundled-default',
      },
    ];

    const counts = { w1: 0, w2: 0 };
    for (let i = 0; i < 100; i += 1) {
      const pick = selectSessionWords({
        words,
        difficulties: ['easy'],
        wordCount: 1,
        usage: { w1: 8 },
        enabledPackIds: ['bundled-default'],
      })[0] as 'w1' | 'w2';
      counts[pick] += 1;
    }
    expect(counts.w2).toBeGreaterThan(counts.w1);
  });
});
