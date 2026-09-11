import { describe, expect, it } from '@jest/globals';

import { applySpotcheck } from '../apply-spotcheck';
import type { CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';
import type { WordBatch } from '../word-batches';

function word(partial: Partial<CsvWord> & Pick<CsvWord, 'text'>): CsvWord {
  return {
    id: partial.id ?? stableWordId(partial.text),
    text: partial.text,
    difficulty: partial.difficulty ?? 'hard',
    category: partial.category ?? 'transport',
    status: partial.status ?? 'core',
    group: partial.group ?? 'bus',
  };
}

describe('applySpotcheck', () => {
  it('rejects flagged rows and keeps the batch when fail rate is <= 5%', () => {
    const rows = [
      word({ text: 'трактор' }),
      word({ text: 'тролейбус' }),
      word({ text: 'фура' }),
      word({ text: 'баржа' }),
      word({ text: 'катер' }),
      word({ text: 'паром' }),
      word({ text: 'дрезина' }),
      word({ text: 'сегвей' }),
      word({ text: 'монорейка' }),
      word({ text: 'гідроцикл' }),
      word({ text: 'аеростат' }),
      word({ text: 'дирижабль' }),
      word({ text: 'теплохід' }),
      word({ text: 'есмінець' }),
      word({ text: 'криголам' }),
      word({ text: 'бензовоз' }),
      word({ text: 'автоцистерна' }),
      word({ text: 'електричка' }),
      word({ text: 'швидкісний потяг' }),
      word({ text: 'маршрутка' }),
    ];
    const batch: WordBatch = { name: 'hard-01', tier: 'hard', ids: rows.map((row) => row.id) };
    const sample = rows.slice(0, 20);
    const decisions = {
      batch: 'hard-01',
      items: sample.map((row, index) => ({
        id: row.id,
        action: index === 0 ? ('reject' as const) : ('accept' as const),
      })),
    };
    const result = applySpotcheck(rows, batch, decisions);
    expect(result.rejected).toBe(1);
    expect(result.batchFlipped).toBe(false);
    expect(rows[0]).toMatchObject({ status: 'reject', group: '' });
    expect(rows[1]?.status).toBe('core');
  });

  it('flips remaining core rows to review when fail rate is > 5%', () => {
    const keep = word({ text: 'трактор' });
    const failA = word({ text: 'тролейбус' });
    const failB = word({ text: 'фура' });
    const extra = word({ text: 'баржа' });
    const rows = [keep, failA, failB, extra];
    const batch: WordBatch = { name: 'hard-01', tier: 'hard', ids: rows.map((row) => row.id) };
    const result = applySpotcheck(rows, batch, {
      batch: 'hard-01',
      items: [
        { id: failA.id, action: 'reject' },
        { id: failB.id, action: 'reject' },
        { id: keep.id, action: 'accept' },
      ],
    });
    expect(result.batchFlipped).toBe(true);
    expect(failA.status).toBe('reject');
    expect(failB.status).toBe('reject');
    expect(keep.status).toBe('review');
    expect(extra.status).toBe('review');
    expect(result.flippedToReview).toBe(2);
  });
});
