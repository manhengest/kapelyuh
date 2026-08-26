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
});
