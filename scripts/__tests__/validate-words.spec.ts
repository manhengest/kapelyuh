import { describe, expect, it } from '@jest/globals';

import { formatWordsCsv, parseWordsCsv, type CsvWord } from '../words-csv';
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

describe('scripts/validate-words', () => {
  it('round-trips a valid CSV', () => {
    const words = [word({ text: 'слон' }), word({ text: 'книга', category: 'school' })];
    const csv = formatWordsCsv(words);
    const parsed = parseWordsCsv(csv);
    expect(parsed).toEqual(words);
    expect(validateWords(parsed).errors).toEqual([]);
  });

  it('flags unknown categories', () => {
    const { errors } = validateWords([word({ text: 'тест', category: 'not-a-cat' })]);
    expect(errors.some((error: string) => error.includes('unknown category'))).toBe(true);
  });

  it('flags unstable ids', () => {
    const { errors } = validateWords([word({ id: 'w_bad', text: 'слон' })]);
    expect(errors.some((error: string) => error.includes('unstable id'))).toBe(true);
  });

  it('flags normalized duplicates among active words', () => {
    const { errors } = validateWords([word({ text: 'вайфай' }), word({ text: 'вай-фай' })]);
    expect(errors.some((error: string) => error.includes('normalized duplicate'))).toBe(true);
  });

  it('allows reject status for alternate spellings', () => {
    const { errors } = validateWords([
      word({ text: 'вайфай' }),
      word({ text: 'вай-фай', status: 'reject' }),
    ]);
    expect(errors.filter((error: string) => error.includes('normalized duplicate'))).toEqual([]);
  });

  it('accepts 2–3 token elite phrases and 10+ letter singles', () => {
    const { errors } = validateWords([
      word({ text: 'зубна щітка', difficulty: 'elite', category: 'home' }),
      word({ text: 'електричка', difficulty: 'elite', category: 'transport' }),
      word({ text: 'Київська перепічка', difficulty: 'elite', category: 'food' }),
    ]);
    expect(errors.filter((error) => error.includes('elite'))).toEqual([]);
  });

  it('accepts elite phrases with short function words and 4 tokens', () => {
    const { errors } = validateWords([
      word({ text: 'мавпа з гранатою', difficulty: 'elite', category: 'abstract' }),
      word({ text: 'як риба у воді', difficulty: 'elite', category: 'abstract' }),
      word({ text: 'на мазі', difficulty: 'elite', category: 'abstract' }),
    ]);
    expect(errors.filter((error) => error.includes('elite'))).toEqual([]);
  });

  it('rejects elite cards that are too short, too many tokens, or over 32 chars', () => {
    const tooShort = validateWords([word({ text: 'борщ', difficulty: 'elite' })]);
    expect(tooShort.errors.some((error) => error.includes('elite shape'))).toBe(true);

    const fourContent = validateWords([
      word({ text: 'один два три чотири', difficulty: 'elite', category: 'abstract' }),
    ]);
    expect(fourContent.errors.some((error) => error.includes('function word'))).toBe(true);

    const fiveTokens = validateWords([
      word({ text: 'коли рак на горі свисне', difficulty: 'elite', category: 'abstract' }),
    ]);
    expect(fiveTokens.errors.some((error) => error.includes('elite shape'))).toBe(true);

    const long = 'а'.repeat(33);
    const tooLong = validateWords([word({ text: long, difficulty: 'elite' })]);
    expect(tooLong.errors.some((error) => error.includes('card too long'))).toBe(true);
  });

  it('warns when an elite phrase contains another active word as a whole-word subset', () => {
    const { warnings } = validateWords([
      word({ text: 'щітка', category: 'home' }),
      word({ text: 'зубна щітка', difficulty: 'elite', category: 'home' }),
    ]);
    expect(warnings.some((warning) => errorIncludesSubset(warning))).toBe(true);
  });
});

function errorIncludesSubset(warning: string): boolean {
  return warning.includes('subset of') && warning.includes('зубна щітка');
}
