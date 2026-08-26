import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, jest } from '@jest/globals';

import type { Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';

import { parseWordsCsv } from '../../../../scripts/words-csv';

const BUNDLED_PACK_ID = 'bundled-default';
const THEMATIC_PACK_ID = 'pack:thematic';
const SESSION_COUNT = 10_000;
const WORD_COUNT = 30;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function loadCoreWords(): Word[] {
  const csv = readFileSync(join(__dirname, '../../../../scripts/words-master.csv'), 'utf8');
  return parseWordsCsv(csv)
    .filter((row) => row.status === 'core')
    .map((row) => ({
      id: row.id,
      text: row.text,
      difficulty: row.difficulty,
      categoryId: row.category,
      packId: row.status === 'pack' ? THEMATIC_PACK_ID : BUNDLED_PACK_ID,
      groupId: row.group || undefined,
    }));
}

describe('selectSessionWords production properties', () => {
  jest.setTimeout(120_000);

  const core = loadCoreWords();
  const byId = new Map(core.map((word) => [word.id, word]));
  const grouped = core.filter((word) => word.groupId);

  it('never collides members of a real confusion group in a dense pool', () => {
    const fillers = core.filter((word) => !word.groupId).slice(0, 20);
    const pool = [...grouped, ...fillers];

    for (let i = 0; i < 500; i += 1) {
      const ids = selectSessionWords({
        words: pool,
        difficulties: ['easy', 'medium', 'hard'],
        wordCount: 30,
        usage: {},
        enabledPackIds: [BUNDLED_PACK_ID],
        rng: mulberry32(i + 1),
      });
      const seenGroups = new Set<string>();
      for (const id of ids) {
        const groupId = byId.get(id)?.groupId;
        if (!groupId) continue;
        expect(seenGroups.has(groupId)).toBe(false);
        seenGroups.add(groupId);
      }
    }
  });

  it('simulates 10,000 finished matches without collisions, with full coverage', () => {
    const usage: Record<string, number> = {};
    const pickCounts = new Map<string, number>();
    const categoryPicks = new Map<string, number>();
    const difficultyPicks = { easy: 0, medium: 0, hard: 0 };

    for (let i = 0; i < SESSION_COUNT; i += 1) {
      const ids = selectSessionWords({
        words: core,
        difficulties: ['easy', 'medium', 'hard'],
        wordCount: WORD_COUNT,
        usage,
        enabledPackIds: [BUNDLED_PACK_ID],
        rng: mulberry32(i + 1),
      });

      expect(ids).toHaveLength(WORD_COUNT);
      expect(new Set(ids).size).toBe(WORD_COUNT);

      const seenGroups = new Set<string>();
      for (const id of ids) {
        const word = byId.get(id);
        expect(word).toBeDefined();
        if (!word) continue;
        expect(word.packId).toBe(BUNDLED_PACK_ID);
        pickCounts.set(id, (pickCounts.get(id) ?? 0) + 1);
        categoryPicks.set(word.categoryId, (categoryPicks.get(word.categoryId) ?? 0) + 1);
        difficultyPicks[word.difficulty] += 1;
        if (word.groupId) {
          expect(seenGroups.has(word.groupId)).toBe(false);
          seenGroups.add(word.groupId);
        }
        usage[id] = (usage[id] ?? 0) + 1;
      }
    }

    expect(pickCounts.size).toBe(core.length);
    expect(difficultyPicks.easy).toBe(SESSION_COUNT * 10);
    expect(difficultyPicks.medium).toBe(SESSION_COUNT * 10);
    expect(difficultyPicks.hard).toBe(SESSION_COUNT * 10);

    const catalogCategories = new Set(core.map((word) => word.categoryId));
    expect(categoryPicks.size).toBe(catalogCategories.size);
    for (const category of catalogCategories) {
      expect(categoryPicks.get(category)).toBeGreaterThan(0);
    }

    const pickValues = [...pickCounts.values()];
    expect(Math.min(...pickValues)).toBeGreaterThan(0);
    expect(Math.max(...pickValues)).toBeLessThan(SESSION_COUNT);
  });
});
