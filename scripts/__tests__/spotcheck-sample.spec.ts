import { describe, expect, it } from '@jest/globals';

import { parseSpotcheckArgs, sampleIds, selectSpotcheckCards } from '../word-batches';
import type { CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';

function word(text: string, status: CsvWord['status'] = 'core'): CsvWord {
  return {
    id: stableWordId(text),
    text,
    difficulty: 'hard',
    category: 'transport',
    status,
    group: '',
  };
}

describe('spotcheck sampling', () => {
  it('is deterministic for the same seed', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `w_${String(i).padStart(10, '0')}`);
    expect(sampleIds(ids, 10, 'spotcheck:hard-01:10')).toEqual(
      sampleIds(ids, 10, 'spotcheck:hard-01:10'),
    );
    expect(sampleIds(ids, 10, 'spotcheck:hard-01:10')).not.toEqual(
      sampleIds(ids, 10, 'spotcheck:hard-02:10'),
    );
  });

  it('samples only core rows from the batch', () => {
    const rows = [word('трактор'), word('фура', 'reject'), word('баржа'), word('катер')];
    const sampled = selectSpotcheckCards(
      rows,
      rows.map((row) => row.id),
      'hard-01',
      100,
    );
    expect(sampled.map((row) => row.text).sort()).toEqual(['баржа', 'катер', 'трактор']);
  });

  it('parses --spotcheck args', () => {
    expect(parseSpotcheckArgs(['node', 'script', '--spotcheck', 'hard-01', '--pct', '15'])).toEqual(
      {
        batch: 'hard-01',
        pct: 15,
      },
    );
    expect(parseSpotcheckArgs(['node', 'script'])).toBeNull();
  });
});
