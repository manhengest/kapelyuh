import { describe, expect, it } from '@jest/globals';

import { applyEliteDecisions } from '../apply-elite-decisions';
import type { CsvWord } from '../words-csv';
import { stableWordId } from '../words-id';

function word(partial: Partial<CsvWord> & Pick<CsvWord, 'text'>): CsvWord {
  return {
    id: partial.id ?? stableWordId(partial.text),
    text: partial.text,
    difficulty: partial.difficulty ?? 'elite',
    category: partial.category ?? 'abstract',
    status: partial.status ?? 'review',
    group: partial.group ?? '',
  };
}

describe('applyEliteDecisions', () => {
  it('accepts review rows as elite core and rejects others', () => {
    const words = [word({ text: 'бити байдики' }), word({ text: 'слабкий приклад' })];
    const result = applyEliteDecisions(words, {
      items: [
        { id: words[0]!.id, action: 'accept' },
        { id: words[1]!.id, action: 'reject' },
      ],
    });
    expect(result.accepted).toBe(1);
    expect(result.rejected).toBe(1);
    expect(words[0]).toMatchObject({ status: 'core', difficulty: 'elite' });
    expect(words[1]).toMatchObject({ status: 'reject', group: '' });
  });

  it('moves idiomatic hard phrases to elite and groups subset phrases', () => {
    const face = word({ text: 'обличчя', difficulty: 'medium', status: 'core', category: 'body' });
    const loss = word({
      text: 'втрата обличчя',
      difficulty: 'hard',
      status: 'core',
      category: 'abstract',
    });
    const words = [face, loss];
    applyEliteDecisions(words, { items: [{ id: loss.id, action: 'move-elite' }] });
    expect(loss).toMatchObject({ difficulty: 'elite', status: 'core' });
    expect(loss.group).toBe(face.group);
    expect(loss.group.length).toBeGreaterThan(1);
    expect(face.group).toBe(loss.group);
  });

  it('rewrites text and regenerates the stable id', () => {
    const row = word({ text: 'стара фраза' });
    const previousId = row.id;
    applyEliteDecisions([row], {
      items: [{ id: previousId, action: 'rewrite', text: 'нова фраза', accept: true }],
    });
    expect(row.text).toBe('нова фраза');
    expect(row.id).toBe(stableWordId('нова фраза'));
    expect(row.status).toBe('core');
  });
});
