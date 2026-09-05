import { describe, expect, it } from '@jest/globals';

import { strings } from '@content/strings';

describe('strings.results.stats.matchDuration', () => {
  it('formats durations under a minute in seconds', () => {
    expect(strings.results.stats.matchDuration(45_000)).toBe('Гра тривала 45 секунд');
    expect(strings.results.stats.matchDuration(1_000)).toBe('Гра тривала 1 секунду');
    expect(strings.results.stats.matchDuration(2_000)).toBe('Гра тривала 2 секунди');
  });

  it('formats durations under an hour in minutes', () => {
    expect(strings.results.stats.matchDuration(23 * 60_000)).toBe('Гра тривала 23 хвилини');
    expect(strings.results.stats.matchDuration(60_000)).toBe('Гра тривала 1 хвилину');
    expect(strings.results.stats.matchDuration(5 * 60_000)).toBe('Гра тривала 5 хвилин');
  });

  it('formats hour-long games without leftover seconds', () => {
    expect(strings.results.stats.matchDuration(3_600_000)).toBe('Гра тривала 1 годину');
    expect(strings.results.stats.matchDuration(3_600_000 + 12 * 60_000)).toBe(
      'Гра тривала 1 годину 12 хвилин',
    );
    expect(strings.results.stats.matchDuration(2 * 3_600_000)).toBe('Гра тривала 2 години');
  });
});
