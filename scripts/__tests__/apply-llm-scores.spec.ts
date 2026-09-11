import { describe, expect, it } from '@jest/globals';

import { applyLlmScores, llmScorePass } from '../apply-llm-scores';
import type { CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';
import type { LlmScore, WordBatch } from '../word-batches';

function word(partial: Partial<CsvWord> & Pick<CsvWord, 'text'>): CsvWord {
  return {
    id: partial.id ?? stableWordId(partial.text),
    text: partial.text,
    difficulty: partial.difficulty ?? 'hard',
    category: partial.category ?? 'transport',
    status: partial.status ?? 'review',
    group: partial.group ?? '',
  };
}

describe('applyLlmScores', () => {
  it('promotes rows that pass both heuristic and LLM gates', () => {
    const tractor = word({ text: 'трактор', category: 'transport' });
    const batch: WordBatch = { name: 'hard-01', tier: 'hard', ids: [tractor.id] };
    const scores: LlmScore[] = [{ id: tractor.id, alias: 8, crocodile: 8, association: 8 }];
    const result = applyLlmScores([tractor], batch, scores);
    expect(result.accepted).toBe(1);
    expect(result.rejected).toBe(0);
    expect(tractor.status).toBe('core');
  });

  it('rejects when the LLM crocodile score is below the hard floor', () => {
    const tractor = word({ text: 'трактор', category: 'transport' });
    const batch: WordBatch = { name: 'hard-01', tier: 'hard', ids: [tractor.id] };
    const scores: LlmScore[] = [{ id: tractor.id, alias: 8, crocodile: 5, association: 8 }];
    const result = applyLlmScores([tractor], batch, scores);
    expect(result.llmFails).toBe(1);
    expect(result.rejected).toBe(1);
    expect(tractor.status).toBe('reject');
    expect(tractor.group).toBe('');
  });

  it('allows elite crocodile 4 and still requires alias 6', () => {
    expect(llmScorePass('elite', { alias: 6, crocodile: 4, association: 6 })).toBe(true);
    expect(llmScorePass('elite', { alias: 5, crocodile: 9, association: 9 })).toBe(false);
    expect(llmScorePass('hard', { alias: 6, crocodile: 4, association: 6 })).toBe(false);
  });

  it('reports missing scores without mutating other rows', () => {
    const tractor = word({ text: 'трактор', category: 'transport' });
    const batch: WordBatch = { name: 'hard-01', tier: 'hard', ids: [tractor.id] };
    const result = applyLlmScores([tractor], batch, []);
    expect(result.missingScores).toEqual([tractor.id]);
    expect(tractor.status).toBe('review');
  });
});
