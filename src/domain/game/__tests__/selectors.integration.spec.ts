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
import { selectSessionWordsWithHistory } from '@domain/game/wordSelector';

import { beginTurn, awardWord, expireTimer, guessCurrentWord, makeTeam, startMatch } from './helpers';

describe('domain/game/selectors integration', () => {
  it('selectCurrentTeam returns the active team', () => {
    const state = startMatch(['w1', 'w2']);
    expect(selectCurrentTeam(state)?.id).toBe('t1');
  });

  it('selectRemainingWords includes the active card and queued words', () => {
    let state = startMatch(['w1', 'w2', 'w3']);
    state = beginTurn(state);
    const remaining = selectRemainingWords(state, { w1: 'один', w2: 'два', w3: 'три' });

    expect(remaining).toHaveLength(3);
    expect(remaining[0]?.text).toBeTruthy();
  });

  it('selectRemainingWordCount tracks queue plus active card', () => {
    let state = startMatch(['w1', 'w2']);
    state = beginTurn(state);
    expect(selectRemainingWordCount(state)).toBe(2);
  });

  it('selectScoreboard and selectWinners derive totals from team scores', () => {
    let state = startMatch(['w1', 'w2'], [
      makeTeam('t1', 'А'),
      makeTeam('t2', 'Б'),
    ]);
    state = beginTurn(state);
    state = guessCurrentWord(state);

    const board = selectScoreboard(state);
    expect(board[0]?.total).toBe(1);
    expect(selectWinners(state).map((team) => team.id)).toEqual(['t1']);
  });

  it('selectReviewCta returns next_turn while words remain', () => {
    let state = startMatch(['w1', 'w2', 'w3']);
    state = beginTurn(state);
    state = guessCurrentWord(state);
    state = expireTimer(state);
    state = awardWord(state, null);

    expect(selectIsHatEmpty(state)).toBe(false);
    expect(selectReviewCta(state)).toBe('next_turn');
  });
});

describe('selectSessionWordsWithHistory', () => {
  it('pulls exclusions from the query adapter', () => {
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

    const ids = selectSessionWordsWithHistory(
      words,
      { difficulties: ['easy'], wordCount: 1, enabledPackIds: ['bundled-default'] },
      { getRecentSessionWordIds: () => ['w1'] },
    );

    expect(ids).toEqual(['w2']);
  });
});
