import { describe, expect, it } from '@jest/globals';

import { shuffle, shuffleInPlace } from '@domain/utils/shuffle';

describe('domain/utils/shuffle', () => {
  it('returns a permutation with the same elements', () => {
    const source = [1, 2, 3, 4, 5];
    const result = shuffle(source, () => 0);

    expect(result.sort()).toEqual(source.sort());
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });

  it('shuffles in place', () => {
    const items = ['a', 'b', 'c'];
    const returned = shuffleInPlace(items, () => 0.99);

    expect(returned).toBe(items);
    expect(items).toHaveLength(3);
  });
});
