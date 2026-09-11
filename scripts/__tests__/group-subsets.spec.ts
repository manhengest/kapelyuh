import { describe, expect, it } from '@jest/globals';

import { groupSubsets } from '../group-subsets';
import type { CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';

function word(partial: Partial<CsvWord> & Pick<CsvWord, 'text'>): CsvWord {
  return {
    id: partial.id ?? stableWordId(partial.text),
    text: partial.text,
    difficulty: partial.difficulty ?? 'hard',
    category: partial.category ?? 'abstract',
    status: partial.status ?? 'core',
    group: partial.group ?? '',
  };
}

describe('groupSubsets', () => {
  it('copies the single-word group onto an ungrouped phrase', () => {
    const face = word({ text: 'обличчя', category: 'body', group: 'face' });
    const loss = word({ text: 'втрата обличчя', category: 'abstract' });
    const changed = groupSubsets([face, loss]);
    expect(changed).toBe(1);
    expect(loss.group).toBe('face');
    expect(face.group).toBe('face');
  });

  it('creates a latin group when both cards are ungrouped', () => {
    const face = word({ text: 'обличчя', category: 'body' });
    const loss = word({ text: 'втрата обличчя', category: 'abstract' });
    groupSubsets([face, loss]);
    expect(face.group.length).toBeGreaterThan(1);
    expect(loss.group).toBe(face.group);
  });

  it('does not overwrite an existing phrase group', () => {
    const face = word({ text: 'обличчя', category: 'body', group: 'face' });
    const loss = word({ text: 'втрата обличчя', category: 'abstract', group: 'idiom' });
    const changed = groupSubsets([face, loss]);
    expect(changed).toBe(0);
    expect(loss.group).toBe('idiom');
  });
});
