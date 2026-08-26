import { describe, expect, it } from '@jest/globals';

import { PLAYABILITY_MIN, scorePlayability } from '../word-playability';
import { type CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';
import { validateWords } from '../validate-words';

function word(partial: Partial<CsvWord> & Pick<CsvWord, 'text'>): CsvWord {
  const text = partial.text;
  return {
    id: partial.id ?? stableWordId(text),
    text,
    difficulty: partial.difficulty ?? 'easy',
    category: partial.category ?? 'animals',
    status: partial.status ?? 'core',
    group: partial.group ?? '',
  };
}

describe('scripts/word-playability', () => {
  it('passes gold examples that should stay in the deck', () => {
    const passWords = [
      word({ text: 'яблуко', category: 'food' }),
      word({ text: 'собака', category: 'animals' }),
      word({ text: 'таксі', category: 'transport' }),
      word({ text: 'футбол', category: 'sports' }),
      word({ text: 'хабар', category: 'society', difficulty: 'medium' }),
      word({ text: 'евакуація', category: 'events', difficulty: 'hard' }),
    ];

    for (const entry of passWords) {
      const score = scorePlayability(entry);
      expect(score.pass).toBe(true);
      expect(score.min).toBeGreaterThanOrEqual(PLAYABILITY_MIN);
    }
  });

  it('fails gold examples that should not be in the deck', () => {
    const failWords = [
      word({ text: 'парадигма', category: 'abstract', difficulty: 'hard' }),
      word({ text: 'критерій', category: 'abstract' }),
      word({ text: 'варіант', category: 'abstract' }),
      word({ text: 'сенс', category: 'abstract', difficulty: 'hard' }),
      word({ text: 'гедонізм', category: 'abstract', difficulty: 'hard' }),
      word({ text: 'децентралізація', category: 'society', difficulty: 'hard' }),
      word({ text: 'стоїцизм', category: 'abstract', difficulty: 'hard' }),
    ];

    for (const entry of failWords) {
      const score = scorePlayability(entry);
      expect(score.pass).toBe(false);
      expect(score.min).toBeLessThan(PLAYABILITY_MIN);
    }
  });

  it('treats 6 as the pass floor', () => {
    const borderline = scorePlayability(
      word({ text: 'хабар', category: 'society', difficulty: 'medium' }),
    );
    expect(borderline.crocodile).toBeGreaterThanOrEqual(PLAYABILITY_MIN);
    expect(borderline.pass).toBe(true);

    const below = scorePlayability(
      word({ text: 'сенс', category: 'abstract', difficulty: 'hard' }),
    );
    expect(below.min).toBeLessThan(PLAYABILITY_MIN);
    expect(below.pass).toBe(false);
  });
});

describe('validateWords playability option', () => {
  it('does not add playability errors by default', () => {
    const words = [word({ text: 'сенс', category: 'abstract', difficulty: 'hard' })];
    const { errors } = validateWords(words);
    expect(errors.some((error) => error.includes('playability fail'))).toBe(false);
  });

  it('adds playability errors when enabled', () => {
    const words = [word({ text: 'сенс', category: 'abstract', difficulty: 'hard' })];
    const { errors } = validateWords(words, { playability: true });
    expect(errors.some((error) => error.includes('playability fail'))).toBe(true);
  });

  it('skips playability for reject rows', () => {
    const words = [
      word({ text: 'сенс', category: 'abstract', difficulty: 'hard', status: 'reject' }),
    ];
    const { errors } = validateWords(words, { playability: true });
    expect(errors.some((error) => error.includes('playability fail'))).toBe(false);
  });
});
