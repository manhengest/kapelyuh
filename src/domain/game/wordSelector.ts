import { shuffle } from '@domain/utils/shuffle';

import type { Difficulty, Word } from './types';

export interface WordSelectorInput {
  words: Word[];
  difficulties: Difficulty[];
  wordCount: number;
  excludedWordIds: readonly string[];
  enabledPackIds?: readonly string[];
}

export interface SessionWordQuery {
  getRecentSessionWordIds(limitSessions: number): string[];
}

const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function filterByPacks(words: Word[], enabledPackIds?: readonly string[]): Word[] {
  if (!enabledPackIds || enabledPackIds.length === 0) {
    return words;
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

function excludeWords(words: Word[], excludedIds: readonly string[]): Word[] {
  if (excludedIds.length === 0) {
    return words;
  }

  const excluded = new Set(excludedIds);
  return words.filter((word) => !excluded.has(word.id));
}

function sampleProportional(words: Word[], difficulties: Difficulty[], count: number): Word[] {
  if (difficulties.length <= 1) {
    return shuffle(words).slice(0, count);
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

  for (const difficulty of difficulties) {
    const bucket = shuffle(buckets.get(difficulty) ?? []);
    const take = perBucket + (remainder > 0 ? 1 : 0);
    if (remainder > 0) {
      remainder -= 1;
    }
    selected.push(...bucket.slice(0, take));
  }

  if (selected.length < count) {
    const selectedIds = new Set(selected.map((word) => word.id));
    const filler = shuffle(words.filter((word) => !selectedIds.has(word.id)));
    selected.push(...filler.slice(0, count - selected.length));
  }

  return shuffle(selected).slice(0, count);
}

function fillPool(words: Word[], count: number, excludedIds: readonly string[]): Word[] {
  let pool = excludeWords(words, excludedIds);

  if (pool.length >= count) {
    return pool;
  }

  pool = excludeWords(words, []);
  if (pool.length >= count) {
    return pool;
  }

  return words;
}

export function selectSessionWords(input: WordSelectorInput): string[] {
  const { words, difficulties, wordCount, excludedWordIds, enabledPackIds } = input;

  if (wordCount <= 0) {
    return [];
  }

  const activeDifficulties = difficulties.length > 0 ? difficulties : ALL_DIFFICULTIES;

  let pool = filterByPacks(words, enabledPackIds);
  pool = filterByDifficulties(pool, activeDifficulties);
  pool = fillPool(pool, wordCount, excludedWordIds);

  if (pool.length === 0) {
    return [];
  }

  const selected = sampleProportional(pool, activeDifficulties, Math.min(wordCount, pool.length));
  return selected.map((word) => word.id);
}

export function selectSessionWordsWithHistory(
  words: Word[],
  settings: Pick<WordSelectorInput, 'difficulties' | 'wordCount' | 'enabledPackIds'>,
  query: SessionWordQuery,
): string[] {
  const excludedWordIds = query.getRecentSessionWordIds(3);
  return selectSessionWords({
    words,
    difficulties: settings.difficulties,
    wordCount: settings.wordCount,
    excludedWordIds,
    enabledPackIds: settings.enabledPackIds,
  });
}
