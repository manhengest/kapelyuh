import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  getUsageMap,
  getWordUsage,
  markWordsUsed,
  resetWordUsage,
} from '@infrastructure/storage/wordUsage';

describe('infrastructure/storage/wordUsage', () => {
  beforeEach(() => {
    resetWordUsage();
  });

  it('returns 0 for unused words without storing zeros', () => {
    expect(getWordUsage('w_new')).toBe(0);
    expect(getUsageMap()).toEqual({});
  });

  it('increments usage once per word for a session', () => {
    markWordsUsed(['w_a', 'w_b'], 'session-1');
    expect(getWordUsage('w_a')).toBe(1);
    expect(getWordUsage('w_b')).toBe(1);
    expect(getUsageMap()).toEqual({ w_a: 1, w_b: 1 });
  });

  it('is idempotent for the same sessionKey', () => {
    markWordsUsed(['w_a'], 'session-1');
    markWordsUsed(['w_a'], 'session-1');
    expect(getWordUsage('w_a')).toBe(1);
  });

  it('increments again for a different session', () => {
    markWordsUsed(['w_a'], 'session-1');
    markWordsUsed(['w_a'], 'session-2');
    expect(getWordUsage('w_a')).toBe(2);
  });

  it('resets usage and session markers', () => {
    markWordsUsed(['w_a'], 'session-1');
    resetWordUsage();
    expect(getWordUsage('w_a')).toBe(0);
    markWordsUsed(['w_a'], 'session-1');
    expect(getWordUsage('w_a')).toBe(1);
  });

  it('ignores empty id lists', () => {
    markWordsUsed([], 'session-1');
    expect(getUsageMap()).toEqual({});
  });
});
