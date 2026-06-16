import { describe, expect, it } from '@jest/globals';

import type { Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';

function makeWord(id: string, difficulty: Word['difficulty']): Word {
  return {
    id,
    text: `word-${id}`,
    difficulty,
    categoryId: 'cat',
    packId: 'bundled-default',
  };
}

describe('domain/game/wordSelector', () => {
  const dictionary: Word[] = [
    ...Array.from({ length: 10 }, (_, index) => makeWord(`easy-${index}`, 'easy')),
    ...Array.from({ length: 10 }, (_, index) => makeWord(`medium-${index}`, 'medium')),
    ...Array.from({ length: 10 }, (_, index) => makeWord(`hard-${index}`, 'hard')),
  ];

  it('selects the requested number of unique session words', () => {
    const ids = selectSessionWords({
      words: dictionary,
      difficulties: ['easy'],
      wordCount: 5,
      excludedWordIds: [],
    });

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    ids.forEach((id) => expect(id.startsWith('easy-')).toBe(true));
  });

  it('excludes words from the last three sessions when enough alternatives exist', () => {
    const ids = selectSessionWords({
      words: dictionary,
      difficulties: ['easy', 'medium'],
      wordCount: 5,
      excludedWordIds: ['easy-0', 'easy-1', 'easy-2'],
    });

    expect(ids.some((id) => ['easy-0', 'easy-1', 'easy-2'].includes(id))).toBe(false);
    expect(ids).toHaveLength(5);
  });

  it('relaxes exclusion when the filtered pool is too small', () => {
    const tinyPool = dictionary.filter((word) => word.difficulty === 'easy').slice(0, 4);
    const ids = selectSessionWords({
      words: tinyPool,
      difficulties: ['easy'],
      wordCount: 4,
      excludedWordIds: ['easy-0', 'easy-1', 'easy-2'],
    });

    expect(ids).toHaveLength(4);
  });

  it('samples proportionally across selected difficulties', () => {
    const ids = selectSessionWords({
      words: dictionary,
      difficulties: ['easy', 'hard'],
      wordCount: 4,
      excludedWordIds: [],
    });

    const easyCount = ids.filter((id) => id.startsWith('easy-')).length;
    const hardCount = ids.filter((id) => id.startsWith('hard-')).length;
    expect(easyCount).toBe(2);
    expect(hardCount).toBe(2);
  });

  it('filters by enabled pack ids', () => {
    const mixed: Word[] = [
      makeWord('a', 'easy'),
      { ...makeWord('b', 'easy'), packId: 'custom-pack' },
    ];

    const ids = selectSessionWords({
      words: mixed,
      difficulties: ['easy'],
      wordCount: 1,
      excludedWordIds: [],
      enabledPackIds: ['bundled-default'],
    });

    expect(ids).toEqual(['a']);
  });

  it('returns an empty list for zero word count', () => {
    expect(
      selectSessionWords({
        words: dictionary,
        difficulties: ['easy'],
        wordCount: 0,
        excludedWordIds: [],
      }),
    ).toEqual([]);
  });

  it('returns an empty list when the dictionary is empty', () => {
    expect(
      selectSessionWords({
        words: [],
        difficulties: ['easy'],
        wordCount: 5,
        excludedWordIds: [],
      }),
    ).toEqual([]);
  });
});
