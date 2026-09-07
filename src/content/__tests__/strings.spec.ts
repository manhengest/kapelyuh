import { describe, expect, it } from '@jest/globals';

import { strings } from '@content/strings';

describe('strings.rounds.hatRemaining', () => {
  it('pluralizes remaining hat words', () => {
    expect(strings.rounds.hatRemaining(1)).toBe('В капелюсі 1 слово');
    expect(strings.rounds.hatRemaining(2)).toBe('В капелюсі 2 слова');
    expect(strings.rounds.hatRemaining(4)).toBe('В капелюсі 4 слова');
    expect(strings.rounds.hatRemaining(0)).toBe('В капелюсі 0 слів');
  });
});

describe('strings.results.recap', () => {
  it('formats duration values under a minute in seconds', () => {
    expect(strings.results.recap.durationValue(45_000)).toBe('45 секунд');
    expect(strings.results.recap.durationValue(1_000)).toBe('1 секунду');
    expect(strings.results.recap.durationValue(2_000)).toBe('2 секунди');
  });

  it('formats duration values under an hour in minutes', () => {
    expect(strings.results.recap.durationValue(23 * 60_000)).toBe('23 хвилини');
    expect(strings.results.recap.durationValue(60_000)).toBe('1 хвилину');
    expect(strings.results.recap.durationValue(5 * 60_000)).toBe('5 хвилин');
  });

  it('formats hour-long games without leftover seconds', () => {
    expect(strings.results.recap.durationValue(3_600_000)).toBe('1 годину');
    expect(strings.results.recap.durationValue(3_600_000 + 12 * 60_000)).toBe('1 годину 12 хвилин');
    expect(strings.results.recap.durationValue(2 * 3_600_000)).toBe('2 години');
  });

  it('formats hardest-attempt copy', () => {
    expect(strings.results.recap.hardestAttempt(5)).toBe('Відгадали лише з 5-ї спроби');
  });

  it('formats recap hero captions without repeating the number', () => {
    expect(strings.results.recap.bestTurnCaption(1)).toBe('слово за один хід');
    expect(strings.results.recap.bestTurnCaption(3)).toBe('слова за один хід');
    expect(strings.results.recap.bestTurnCaption(30)).toBe('слів за один хід');
    expect(strings.results.recap.scoreGapCaption(1)).toBe('бал різниці між командами');
    expect(strings.results.recap.scoreGapCaption(12)).toBe('балів різниці між командами');
    expect(strings.results.recap.secondsUnit(1)).toBe('секунду');
    expect(strings.results.recap.secondsUnit(3)).toBe('секунди');
    expect(strings.results.recap.secondsUnit(8)).toBe('секунд');
    expect(strings.results.recap.secondsUnit(11)).toBe('секунд');
    expect(strings.results.recap.secondsUnit(21)).toBe('секунду');
  });
});
