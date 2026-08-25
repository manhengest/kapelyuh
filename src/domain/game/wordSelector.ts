import { shuffle } from '@domain/utils/shuffle';

import type { Difficulty, Word } from './types';
import { DEFAULT_MATCH_SETTINGS } from './types';

export type RandomSource = () => number;

export interface WordSelectorInput {
  words: Word[];
  difficulties: Difficulty[];
  wordCount: number;
  usage: Readonly<Record<string, number>>;
  enabledPackIds?: readonly string[];
  rng?: RandomSource;
}

const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const CATEGORY_PENALTY = 0.5;

function filterByPacks(words: Word[], enabledPackIds?: readonly string[]): Word[] {
  if (enabledPackIds === undefined) {
    return filterByPacks(words, DEFAULT_MATCH_SETTINGS.enabledPackIds);
  }

  if (enabledPackIds.length === 0) {
    return [];
  }

  const packSet = new Set(enabledPackIds);
  return words.filter((word) => packSet.has(word.packId));
}

function filterByDifficulties(words: Word[], difficulties: Difficulty[]): Word[] {
  if (difficulties.length === 0) {
    return words;
  }

  const difficultySet = new Set(difficulties);
  return words.filter((word) => difficultySet.has(word.difficulty));
}

function freshnessWeight(usageCount: number): number {
  return 1 / (1 + usageCount);
}

/**
 * Weighted random draw without replacement.
 * Applies group collision exclusion and soft category balancing.
 */
function weightedSample(
  candidates: Word[],
  count: number,
  usage: Readonly<Record<string, number>>,
  rng: RandomSource,
): Word[] {
  if (count <= 0 || candidates.length === 0) {
    return [];
  }

  type Entry = { word: Word; weight: number };
  const pool: Entry[] = candidates.map((word) => ({
    word,
    weight: freshnessWeight(usage[word.id] ?? 0),
  }));

  const selected: Word[] = [];
  const blockedGroups = new Set<string>();
  const categoryCounts = new Map<string, number>();

  while (selected.length < count && pool.length > 0) {
    let total = 0;
    for (const entry of pool) {
      const categoryCount = categoryCounts.get(entry.word.categoryId) ?? 0;
      const categoryFactor = categoryCount > 0 ? Math.pow(CATEGORY_PENALTY, categoryCount) : 1;
      total += entry.weight * categoryFactor;
    }

    if (total <= 0) {
      break;
    }

    let cursor = rng() * total;
    let pickIndex = pool.length - 1;
    for (let i = 0; i < pool.length; i += 1) {
      const entry = pool[i]!;
      const categoryCount = categoryCounts.get(entry.word.categoryId) ?? 0;
      const categoryFactor = categoryCount > 0 ? Math.pow(CATEGORY_PENALTY, categoryCount) : 1;
      cursor -= entry.weight * categoryFactor;
      if (cursor <= 0) {
        pickIndex = i;
        break;
      }
    }

    const picked = pool.splice(pickIndex, 1)[0]!;
    selected.push(picked.word);

    if (picked.word.groupId) {
      blockedGroups.add(picked.word.groupId);
    }
    categoryCounts.set(
      picked.word.categoryId,
      (categoryCounts.get(picked.word.categoryId) ?? 0) + 1,
    );

    if (blockedGroups.size > 0) {
      for (let i = pool.length - 1; i >= 0; i -= 1) {
        const groupId = pool[i]!.word.groupId;
        if (groupId && blockedGroups.has(groupId)) {
          pool.splice(i, 1);
        }
      }
    }
  }

  if (selected.length < count) {
    const selectedIds = new Set(selected.map((word) => word.id));
    const leftovers = candidates.filter((word) => !selectedIds.has(word.id));
    const filler = weightedSample(leftovers, count - selected.length, usage, rng);
    selected.push(...filler);
  }

  return selected;
}

function sampleProportional(
  words: Word[],
  difficulties: Difficulty[],
  count: number,
  usage: Readonly<Record<string, number>>,
  rng: RandomSource,
): Word[] {
  if (difficulties.length <= 1) {
    return weightedSample(words, count, usage, rng);
  }

  const buckets = new Map<Difficulty, Word[]>();
  for (const difficulty of difficulties) {
    buckets.set(difficulty, []);
  }

  for (const word of words) {
    const bucket = buckets.get(word.difficulty);
    if (bucket) {
      bucket.push(word);
    }
  }

  const perBucket = Math.floor(count / difficulties.length);
  let remainder = count % difficulties.length;
  const selected: Word[] = [];
  const selectedIds = new Set<string>();
  const blockedGroups = new Set<string>();

  for (const difficulty of difficulties) {
    const bucket = (buckets.get(difficulty) ?? []).filter((word) => {
      if (selectedIds.has(word.id)) return false;
      if (word.groupId && blockedGroups.has(word.groupId)) return false;
      return true;
    });
    const take = perBucket + (remainder > 0 ? 1 : 0);
    if (remainder > 0) {
      remainder -= 1;
    }
    const picked = weightedSample(bucket, take, usage, rng);
    for (const word of picked) {
      selected.push(word);
      selectedIds.add(word.id);
      if (word.groupId) {
        blockedGroups.add(word.groupId);
      }
    }
  }

  if (selected.length < count) {
    const fillerPool = words.filter((word) => !selectedIds.has(word.id));
    const filler = weightedSample(fillerPool, count - selected.length, usage, rng);
    selected.push(...filler);
  }

  return shuffle(selected, rng).slice(0, count);
}

export function selectSessionWords(input: WordSelectorInput): string[] {
  const { words, difficulties, wordCount, usage, enabledPackIds, rng = Math.random } = input;

  if (wordCount <= 0) {
    return [];
  }

  const activeDifficulties = difficulties.length > 0 ? difficulties : ALL_DIFFICULTIES;

  let pool = filterByPacks(words, enabledPackIds);
  pool = filterByDifficulties(pool, activeDifficulties);

  if (pool.length === 0) {
    return [];
  }

  const selected = sampleProportional(
    pool,
    activeDifficulties,
    Math.min(wordCount, pool.length),
    usage,
    rng,
  );
  return selected.map((word) => word.id);
}
