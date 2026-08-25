import { describe, expect, it } from '@jest/globals';

import {
  getNextStackWordIds,
  getStackWordIds,
  getVisibleStackDepth,
  STACK_MAX_VISIBLE,
} from '@features/game/components/wordCardStackConfig';

describe('wordCardStack helpers', () => {
  describe('getVisibleStackDepth', () => {
    it('returns 0 when there is no active word and no queue', () => {
      expect(getVisibleStackDepth(false, 0)).toBe(0);
    });

    it('returns 1 for a single available word', () => {
      expect(getVisibleStackDepth(true, 0)).toBe(1);
    });

    it('returns 2 for two available words', () => {
      expect(getVisibleStackDepth(true, 1)).toBe(2);
    });

    it('returns 3 for three available words', () => {
      expect(getVisibleStackDepth(true, 2)).toBe(3);
    });

    it('caps visible depth at 3 for large queues', () => {
      expect(getVisibleStackDepth(true, 89)).toBe(STACK_MAX_VISIBLE);
      expect(getVisibleStackDepth(true, 90)).toBe(STACK_MAX_VISIBLE);
    });
  });

  describe('getStackWordIds', () => {
    it('returns up to three ids with current word first', () => {
      expect(getStackWordIds('a', ['b', 'c', 'd'])).toEqual(['a', 'b', 'c']);
    });

    it('returns only queue ids when there is no current word', () => {
      expect(getStackWordIds(null, ['b', 'c'])).toEqual(['b', 'c']);
    });

    it('returns empty list when hat is empty', () => {
      expect(getStackWordIds(null, [])).toEqual([]);
    });
  });

  describe('getNextStackWordIds', () => {
    it('guess removes the current word and keeps the next three remaining', () => {
      expect(getNextStackWordIds('guess', 'a', ['b', 'c', 'd', 'e'])).toEqual(['b', 'c', 'd']);
    });

    it('guess with two remaining words leaves a two-card stack', () => {
      expect(getNextStackWordIds('guess', 'a', ['b', 'c'])).toEqual(['b', 'c']);
    });

    it('guess of the last word leaves an empty stack', () => {
      expect(getNextStackWordIds('guess', 'a', [])).toEqual([]);
    });

    it('skip moves the current word to the tail of a large queue', () => {
      expect(getNextStackWordIds('skip', 'a', ['b', 'c', 'd', 'e'])).toEqual(['b', 'c', 'd']);
    });

    it('skip with two remaining words puts current at the back', () => {
      expect(getNextStackWordIds('skip', 'a', ['b', 'c'])).toEqual(['b', 'c', 'a']);
    });

    it('skip of the last word returns that word as a single card', () => {
      expect(getNextStackWordIds('skip', 'a', [])).toEqual(['a']);
    });
  });
});
