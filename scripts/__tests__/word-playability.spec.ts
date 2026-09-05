import { describe, expect, it } from '@jest/globals';

import { validateWords } from '../validate-words';
import { PLAYABILITY_MIN, scorePlayability } from '../word-playability';
import { type CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';

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

/** Ground truth from scripts/audit/playability-calibration.md (curator `your` + verdict). */
const CALIBRATION_PASS: Array<Partial<CsvWord> & Pick<CsvWord, 'text'>> = [
  { text: 'яблуко', category: 'food' },
  { text: 'собака', category: 'animals' },
  { text: 'ложка', category: 'home' },
  { text: 'будинок', category: 'home' },
  { text: 'сніг', category: 'nature' },
  { text: 'шоколад', category: 'food' },
  { text: 'рука', category: 'body' },
  { text: 'таксі', category: 'transport' },
  { text: 'футбол', category: 'sports' },
  { text: 'банан', category: 'food' },
  { text: 'варіант', category: 'abstract' },
  { text: 'думка', category: 'abstract' },
  { text: 'ідея', category: 'abstract' },
  { text: 'акуратність', category: 'personality' },
  { text: 'зубна щітка', category: 'home', difficulty: 'medium' },
  { text: 'віджимання', category: 'actions', difficulty: 'medium' },
  { text: 'вигул собаки', category: 'actions', difficulty: 'medium' },
  { text: "зав'язування шнурків", category: 'actions', difficulty: 'medium' },
  { text: 'хабар', category: 'society', difficulty: 'medium' },
  { text: 'барикада', category: 'society', difficulty: 'medium' },
  { text: 'арешт', category: 'society', difficulty: 'medium' },
  { text: 'кравець', category: 'professions', difficulty: 'medium' },
  { text: 'катання на велосипеді', category: 'actions', difficulty: 'medium' },
  { text: 'працьовитість', category: 'personality', difficulty: 'medium' },
  { text: 'евакуація', category: 'events', difficulty: 'hard' },
  { text: 'жонглювання', category: 'actions', difficulty: 'hard' },
  { text: 'керлінг', category: 'sports', difficulty: 'hard' },
  { text: 'біонічний протез', category: 'technology', difficulty: 'hard' },
  { text: 'кріокамера', category: 'technology', difficulty: 'hard' },
  { text: 'марширування', category: 'actions', difficulty: 'hard' },
  { text: 'голограма', category: 'technology', difficulty: 'hard' },
  { text: 'мангуст', category: 'animals', difficulty: 'hard' },
  { text: 'асиметрія', category: 'abstract', difficulty: 'hard' },
  { text: 'бюрократія', category: 'society', difficulty: 'hard' },
];

const CALIBRATION_FAIL: Array<Partial<CsvWord> & Pick<CsvWord, 'text'>> = [
  { text: 'знання', category: 'abstract' },
  { text: 'критерій', category: 'abstract' },
  { text: 'логіка', category: 'abstract' },
  { text: 'мета', category: 'abstract' },
  { text: 'назва', category: 'abstract' },
  { text: 'життя', category: 'abstract' },
  { text: 'принцип', category: 'abstract', difficulty: 'medium' },
  { text: 'аналогія', category: 'abstract', difficulty: 'medium' },
  { text: 'аргумент', category: 'abstract', difficulty: 'medium' },
  { text: 'асоціація', category: 'abstract', difficulty: 'medium' },
  { text: 'альтруїзм', category: 'personality', difficulty: 'medium' },
  { text: 'амбітність', category: 'personality', difficulty: 'medium' },
  { text: 'субсидія', category: 'society', difficulty: 'medium' },
  { text: 'щирість', category: 'personality', difficulty: 'medium' },
  { text: 'абсурд', category: 'abstract', difficulty: 'medium' },
  { text: 'альпака', category: 'animals', difficulty: 'medium' },
  { text: 'лобзик', category: 'tools', difficulty: 'hard' },
  { text: 'ламантин', category: 'animals', difficulty: 'hard' },
  { text: 'гедонізм', category: 'abstract', difficulty: 'hard' },
  { text: 'децентралізація', category: 'society', difficulty: 'hard' },
  { text: 'сенс', category: 'abstract', difficulty: 'hard' },
  { text: 'парадигма', category: 'abstract', difficulty: 'hard' },
  { text: 'алегорія', category: 'abstract', difficulty: 'hard' },
  { text: 'алюзія', category: 'abstract', difficulty: 'hard' },
  { text: 'аномалія', category: 'abstract', difficulty: 'hard' },
  { text: 'гіпотеза', category: 'science', difficulty: 'hard' },
  { text: 'стоїцизм', category: 'abstract', difficulty: 'hard' },
];

describe('scripts/word-playability', () => {
  it('passes curator calibration cards', () => {
    for (const entry of CALIBRATION_PASS) {
      const score = scorePlayability(word(entry));
      expect({ text: entry.text, pass: score.pass, min: score.min }).toEqual({
        text: entry.text,
        pass: true,
        min: expect.any(Number),
      });
      expect(score.min).toBeGreaterThanOrEqual(PLAYABILITY_MIN);
    }
  });

  it('fails curator calibration cards (crocodile or recognition)', () => {
    for (const entry of CALIBRATION_FAIL) {
      const score = scorePlayability(word(entry));
      expect({ text: entry.text, pass: score.pass, min: score.min }).toEqual({
        text: entry.text,
        pass: false,
        min: expect.any(Number),
      });
      expect(score.min).toBeLessThan(PLAYABILITY_MIN);
    }
  });

  it('treats 6 as the pass floor', () => {
    const borderline = scorePlayability(word({ text: 'варіант', category: 'abstract' }));
    expect(borderline.crocodile).toBe(PLAYABILITY_MIN);
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
