import { describe, expect, it } from '@jest/globals';

import { isTimerExpired, remainingMs } from '@domain/utils/time';

describe('domain/utils/time', () => {
  it('computes remaining milliseconds without going negative', () => {
    expect(remainingMs(1_000, 400)).toBe(600);
    expect(remainingMs(1_000, 1_500)).toBe(0);
  });

  it('detects timer expiry', () => {
    expect(isTimerExpired(1_000, 999)).toBe(false);
    expect(isTimerExpired(1_000, 1_000)).toBe(true);
    expect(isTimerExpired(1_000, 1_001)).toBe(true);
  });
});
