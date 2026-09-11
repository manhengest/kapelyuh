import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  clearSavedWords,
  deleteSavedWord,
  getSavedWordCount,
  getSavedWords,
  getSavedWordTexts,
  isSavedWordId,
  savedWordId,
  saveWords,
} from '@infrastructure/storage/savedWords';

describe('infrastructure/storage/savedWords', () => {
  beforeEach(() => {
    clearSavedWords();
  });

  it('returns empty after clear', () => {
    expect(getSavedWords()).toEqual({});
    expect(getSavedWordCount()).toBe(0);
    expect(getSavedWordTexts()).toEqual({});
  });

  it('saves unique words at the chosen difficulty', () => {
    const result = saveWords(['борщ', '  свята   вечеря  '], 'hard', []);
    expect(result).toEqual({ saved: 2, skipped: 0 });
    expect(getSavedWordCount()).toBe(2);
    expect(getSavedWords()[savedWordId('борщ')]).toEqual({ text: 'борщ', difficulty: 'hard' });
    expect(getSavedWords()[savedWordId('свята вечеря')]).toEqual({
      text: 'свята вечеря',
      difficulty: 'hard',
    });
  });

  it('skips bundled and already-saved duplicates, including Ukrainian case', () => {
    saveWords(['борщ'], 'easy', []);
    const result = saveWords(['Борщ', 'борщ', 'варення', 'Варення'], 'medium', ['варення']);
    expect(result).toEqual({ saved: 0, skipped: 4 });
    expect(getSavedWordCount()).toBe(1);
  });

  it('skips in-batch duplicates', () => {
    const result = saveWords(['Футбол', 'футбол', 'ФУТБОЛ'], 'easy', []);
    expect(result).toEqual({ saved: 1, skipped: 2 });
    expect(getSavedWordCount()).toBe(1);
  });

  it('ignores empty strings without counting them as skipped', () => {
    const result = saveWords(['', '   ', 'чай'], 'easy', []);
    expect(result).toEqual({ saved: 1, skipped: 0 });
  });

  it('deletes a single word and no-ops unknown ids', () => {
    saveWords(['борщ', 'чай'], 'easy', []);
    const teaId = savedWordId('чай');
    deleteSavedWord(teaId);
    deleteSavedWord('saved_missing');
    expect(getSavedWordTexts()).toEqual({ [savedWordId('борщ')]: 'борщ' });
  });

  it('identifies saved ids by prefix', () => {
    expect(isSavedWordId(savedWordId('борщ'))).toBe(true);
    expect(isSavedWordId('custom_1')).toBe(false);
    expect(isSavedWordId(null)).toBe(false);
  });
});
