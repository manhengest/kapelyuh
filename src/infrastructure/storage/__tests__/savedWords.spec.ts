import { beforeEach, describe, expect, it } from '@jest/globals';

import type { Difficulty } from '@domain/game/types';
import {
  classifyHatWord,
  clearSavedWords,
  deleteSavedWord,
  getSavedWordCount,
  getSavedWords,
  getSavedWordTexts,
  isSavedWordId,
  savedWordId,
  saveWords,
  updateSavedWord,
  type SavedWordRecord,
} from '@infrastructure/storage/savedWords';

function entries(texts: readonly string[], difficulty: Difficulty): SavedWordRecord[] {
  return texts.map((text) => ({ text, difficulty }));
}

describe('infrastructure/storage/savedWords', () => {
  beforeEach(() => {
    clearSavedWords();
  });

  it('returns empty after clear', () => {
    expect(getSavedWords()).toEqual({});
    expect(getSavedWordCount()).toBe(0);
    expect(getSavedWordTexts()).toEqual({});
  });

  it('saves each word at its own difficulty', () => {
    const result = saveWords(
      [
        { text: 'борщ', difficulty: 'hard' },
        { text: '  свята   вечеря  ', difficulty: 'easy' },
      ],
      [],
    );
    expect(result).toEqual({ saved: 2, skipped: 0 });
    expect(getSavedWordCount()).toBe(2);
    expect(getSavedWords()[savedWordId('борщ')]).toEqual({ text: 'борщ', difficulty: 'hard' });
    expect(getSavedWords()[savedWordId('свята вечеря')]).toEqual({
      text: 'свята вечеря',
      difficulty: 'easy',
    });
  });

  it('skips bundled and already-saved duplicates, including Ukrainian case', () => {
    saveWords(entries(['борщ'], 'easy'), []);
    const result = saveWords(entries(['Борщ', 'борщ', 'варення', 'Варення'], 'medium'), [
      'варення',
    ]);
    expect(result).toEqual({ saved: 0, skipped: 4 });
    expect(getSavedWordCount()).toBe(1);
    expect(getSavedWords()[savedWordId('борщ')]?.difficulty).toBe('easy');
  });

  it('skips in-batch duplicates', () => {
    const result = saveWords(entries(['Футбол', 'футбол', 'ФУТБОЛ'], 'easy'), []);
    expect(result).toEqual({ saved: 1, skipped: 2 });
    expect(getSavedWordCount()).toBe(1);
  });

  it('ignores empty strings without counting them as skipped', () => {
    const result = saveWords(entries(['', '   ', 'чай'], 'easy'), []);
    expect(result).toEqual({ saved: 1, skipped: 0 });
  });

  it('classifies new, saved, and bundled words', () => {
    saveWords(entries(['борщ'], 'hard'), []);
    expect(classifyHatWord('суп', ['варення'])).toEqual({ state: 'new' });
    expect(classifyHatWord('Борщ', [])).toEqual({ state: 'saved', difficulty: 'hard' });
    expect(classifyHatWord('варення', ['Варення'])).toEqual({ state: 'bundled' });
    expect(classifyHatWord('борщ', ['борщ'])).toEqual({ state: 'bundled' });
    expect(classifyHatWord('   ', [])).toEqual({ state: 'new' });
  });

  it('renames a word and moves its difficulty', () => {
    saveWords(entries(['борщ', 'чай'], 'easy'), []);
    const id = savedWordId('борщ');
    expect(updateSavedWord(id, '  борщ  ', 'hard', [])).toBe('updated');
    expect(getSavedWords()[id]).toEqual({ text: 'борщ', difficulty: 'hard' });

    expect(updateSavedWord(id, 'суп', 'elite', [])).toBe('updated');
    expect(getSavedWords()[id]).toBeUndefined();
    expect(getSavedWords()[savedWordId('суп')]).toEqual({ text: 'суп', difficulty: 'elite' });
  });

  it('rejects an empty rename, a duplicate, and a missing id', () => {
    saveWords(entries(['борщ', 'чай'], 'easy'), []);
    const id = savedWordId('борщ');
    expect(updateSavedWord(id, '   ', 'hard', [])).toBe('empty');
    expect(updateSavedWord(id, 'Чай', 'hard', [])).toBe('duplicate');
    expect(updateSavedWord(id, 'варення', 'hard', ['варення'])).toBe('duplicate');
    expect(updateSavedWord('saved_missing', 'суп', 'easy', [])).toBe('missing');
    expect(getSavedWords()[id]).toEqual({ text: 'борщ', difficulty: 'easy' });
  });

  it('deletes a single word and no-ops unknown ids', () => {
    saveWords(entries(['борщ', 'чай'], 'easy'), []);
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
