import { describe, expect, it } from '@jest/globals';

import { pluralizeUkrainian } from '../pluralize';

const secondForms = { one: 'секунда', few: 'секунди', many: 'секунд' };
const timeForms = { one: 'раз', few: 'рази', many: 'разів' };
const wordForms = { one: 'слово', few: 'слова', many: 'слів' };

describe('pluralizeUkrainian', () => {
  it('selects the correct form for seconds', () => {
    expect(pluralizeUkrainian(1, secondForms)).toBe('секунда');
    expect(pluralizeUkrainian(2, secondForms)).toBe('секунди');
    expect(pluralizeUkrainian(3, secondForms)).toBe('секунди');
    expect(pluralizeUkrainian(4, secondForms)).toBe('секунди');
    expect(pluralizeUkrainian(5, secondForms)).toBe('секунд');
    expect(pluralizeUkrainian(11, secondForms)).toBe('секунд');
    expect(pluralizeUkrainian(21, secondForms)).toBe('секунда');
    expect(pluralizeUkrainian(22, secondForms)).toBe('секунди');
    expect(pluralizeUkrainian(25, secondForms)).toBe('секунд');
  });

  it('selects the correct form for times', () => {
    expect(pluralizeUkrainian(1, timeForms)).toBe('раз');
    expect(pluralizeUkrainian(2, timeForms)).toBe('рази');
    expect(pluralizeUkrainian(5, timeForms)).toBe('разів');
    expect(pluralizeUkrainian(21, timeForms)).toBe('раз');
    expect(pluralizeUkrainian(22, timeForms)).toBe('рази');
  });

  it('selects the correct form for words', () => {
    expect(pluralizeUkrainian(1, wordForms)).toBe('слово');
    expect(pluralizeUkrainian(2, wordForms)).toBe('слова');
    expect(pluralizeUkrainian(5, wordForms)).toBe('слів');
    expect(pluralizeUkrainian(21, wordForms)).toBe('слово');
    expect(pluralizeUkrainian(22, wordForms)).toBe('слова');
  });
});
