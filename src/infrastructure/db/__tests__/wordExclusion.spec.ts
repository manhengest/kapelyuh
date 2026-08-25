import { describe, expect, it } from '@jest/globals';

import type { Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';

/**
 * Replaces the old "exclude last 3 sessions" integration.
 * Freshness is now driven by the usage map, not session history rows.
 */
describe('session word freshness integration', () => {
  it('heavily favors unused words when usage is skewed', () => {
    const words: Word[] = Array.from({ length: 10 }, (_, index) => ({
      id: `w-${index + 1}`,
      text: `word-${index + 1}`,
      difficulty: 'easy' as const,
      categoryId: 'test',
      packId: 'bundled-default',
    }));

    const usage: Record<string, number> = {
      'w-1': 5,
      'w-2': 5,
      'w-3': 5,
    };

    const selected = selectSessionWords({
      words,
      difficulties: ['easy'],
      wordCount: 3,
      usage,
      enabledPackIds: ['bundled-default'],
    });

    expect(selected).toHaveLength(3);
    expect(selected.some((id) => ['w-1', 'w-2', 'w-3'].includes(id))).toBe(false);
  });
});
