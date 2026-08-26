import { describe, expect, it } from '@jest/globals';

import type { Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';

function makeWord(id: string, difficulty: Word['difficulty'], extras: Partial<Word> = {}): Word {
  return {
    id,
    text: `word-${id}`,
    difficulty,
    categoryId: extras.categoryId ?? 'cat',
    packId: extras.packId ?? 'bundled-default',
    groupId: extras.groupId,
  };
}

function sequentialRng(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
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
      usage: {},
    });

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    ids.forEach((id) => expect(id.startsWith('easy-')).toBe(true));
  });

  it('samples proportionally across selected difficulties', () => {
    const ids = selectSessionWords({
      words: dictionary,
      difficulties: ['easy', 'hard'],
      wordCount: 4,
      usage: {},
      rng: sequentialRng([0.01, 0.01, 0.01, 0.01, 0.5]),
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
      usage: {},
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
        usage: {},
      }),
    ).toEqual([]);
  });

  it('returns an empty list when the dictionary is empty', () => {
    expect(
      selectSessionWords({
        words: [],
        difficulties: ['easy'],
        wordCount: 5,
        usage: {},
      }),
    ).toEqual([]);
  });

  it('avoids group collisions in the same pool', () => {
    const words: Word[] = [
      makeWord('rocket', 'easy', { groupId: 'rocket' }),
      makeWord('racket', 'easy', { groupId: 'rocket' }),
      makeWord('ball', 'easy'),
      makeWord('tree', 'easy'),
    ];

    const ids = selectSessionWords({
      words,
      difficulties: ['easy'],
      wordCount: 3,
      usage: {},
      rng: () => 0,
    });

    expect(ids).toHaveLength(3);
    const hasRocket = ids.includes('rocket');
    const hasRacket = ids.includes('racket');
    expect(hasRocket && hasRacket).toBe(false);
  });

  it('fills hat to wordCount when group collision would undershoot', () => {
    const words: Word[] = [
      makeWord('rocket', 'easy', { groupId: 'rocket' }),
      makeWord('racket', 'easy', { groupId: 'rocket' }),
      makeWord('ball', 'easy'),
      makeWord('tree', 'easy'),
    ];

    const ids = selectSessionWords({
      words,
      difficulties: ['easy'],
      wordCount: 4,
      usage: {},
      rng: () => 0,
    });

    expect(ids).toHaveLength(4);
    expect(ids).toContain('rocket');
    expect(ids).toContain('racket');
  });

  it('defaults to bundled pack when enabledPackIds is omitted', () => {
    const mixed: Word[] = [
      makeWord('a', 'easy'),
      { ...makeWord('b', 'easy'), packId: 'pack:thematic' },
      { ...makeWord('c', 'easy'), packId: 'custom-pack' },
    ];

    const ids = selectSessionWords({
      words: mixed,
      difficulties: ['easy'],
      wordCount: 2,
      usage: {},
    });

    expect(ids).toEqual(['a']);
  });

  it('returns empty when enabledPackIds is empty', () => {
    const ids = selectSessionWords({
      words: dictionary,
      difficulties: ['easy'],
      wordCount: 5,
      usage: {},
      enabledPackIds: [],
    });

    expect(ids).toEqual([]);
  });

  it('avoids group collisions across difficulty buckets', () => {
    const words: Word[] = [
      makeWord('architect', 'easy', { groupId: 'architect_root' }),
      makeWord('e1', 'easy'),
      makeWord('e2', 'easy'),
      makeWord('e3', 'easy'),
      makeWord('architecture', 'hard', { groupId: 'architect_root' }),
      makeWord('h1', 'hard'),
      makeWord('h2', 'hard'),
      makeWord('h3', 'hard'),
    ];

    for (let i = 0; i < 200; i += 1) {
      const ids = selectSessionWords({
        words,
        difficulties: ['easy', 'hard'],
        wordCount: 4,
        usage: {},
      });
      expect(ids.includes('architect') && ids.includes('architecture')).toBe(false);
    }
  });

  it('does not mutate the usage map (abandoned sessions stay unused)', () => {
    const usage: Record<string, number> = {};
    selectSessionWords({
      words: dictionary,
      difficulties: ['easy'],
      wordCount: 5,
      usage,
    });
    expect(usage).toEqual({});
  });

  it('eventually selects every eligible word as usage accumulates', () => {
    const words: Word[] = Array.from({ length: 20 }, (_, index) =>
      makeWord(`w-${index}`, 'easy', { categoryId: `c-${index % 4}` }),
    );
    const usage: Record<string, number> = {};
    const seen = new Set<string>();

    for (let i = 0; i < 80; i += 1) {
      const ids = selectSessionWords({
        words,
        difficulties: ['easy'],
        wordCount: 5,
        usage,
      });
      for (const id of ids) {
        seen.add(id);
        usage[id] = (usage[id] ?? 0) + 1;
      }
    }

    expect(seen.size).toBe(20);
  });

  it('prefers low-usage words over high-usage words', () => {
    const words: Word[] = [makeWord('fresh', 'easy'), makeWord('stale', 'easy')];

    const counts = { fresh: 0, stale: 0 };
    for (let i = 0; i < 200; i += 1) {
      const ids = selectSessionWords({
        words,
        difficulties: ['easy'],
        wordCount: 1,
        usage: { stale: 10 },
      });
      counts[ids[0] as 'fresh' | 'stale'] += 1;
    }

    expect(counts.fresh).toBeGreaterThan(counts.stale * 2);
  });

  it('still allows high-usage words when they are the only option', () => {
    const words: Word[] = [makeWord('only', 'easy')];
    const ids = selectSessionWords({
      words,
      difficulties: ['easy'],
      wordCount: 1,
      usage: { only: 99 },
    });
    expect(ids).toEqual(['only']);
  });

  it('soft-balances categories across the pool', () => {
    const words: Word[] = [
      ...Array.from({ length: 20 }, (_, i) =>
        makeWord(`food-${i}`, 'easy', { categoryId: 'food' }),
      ),
      ...Array.from({ length: 20 }, (_, i) =>
        makeWord(`animals-${i}`, 'easy', { categoryId: 'animals' }),
      ),
    ];

    const ids = selectSessionWords({
      words,
      difficulties: ['easy'],
      wordCount: 10,
      usage: {},
    });

    const food = ids.filter((id) => id.startsWith('food-')).length;
    const animals = ids.filter((id) => id.startsWith('animals-')).length;
    expect(food).toBeGreaterThan(0);
    expect(animals).toBeGreaterThan(0);
    expect(Math.abs(food - animals)).toBeLessThanOrEqual(6);
  });

  it('is deterministic under an injected rng', () => {
    const first = selectSessionWords({
      words: dictionary,
      difficulties: ['easy'],
      wordCount: 5,
      usage: {},
      rng: sequentialRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]),
    });
    const second = selectSessionWords({
      words: dictionary,
      difficulties: ['easy'],
      wordCount: 5,
      usage: {},
      rng: sequentialRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]),
    });
    expect(first).toEqual(second);
  });
});
