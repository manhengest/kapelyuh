import type { Difficulty } from '@domain/game/types';

import { customWordDedupeKey, normalizeCustomWord } from './customWords';
import { clearJson, getJson, setJson } from './mmkv';

const SAVED_WORDS_KEY = 'kapelyukh.savedWords.v1';

export const SAVED_WORD_ID_PREFIX = 'saved_';

export type SavedWordRecord = {
  text: string;
  difficulty: Difficulty;
};

export type SavedWordsMap = Record<string, SavedWordRecord>;

export type SaveWordsResult = {
  saved: number;
  skipped: number;
};

export type HatWordClassification =
  | { state: 'new' }
  | { state: 'saved'; difficulty: Difficulty }
  | { state: 'bundled' };

function readWords(): SavedWordsMap {
  return getJson<SavedWordsMap>(SAVED_WORDS_KEY) ?? {};
}

function writeWords(words: SavedWordsMap): void {
  setJson(SAVED_WORDS_KEY, words);
}

function dedupeKeySet(texts: readonly string[]): Set<string> {
  return new Set(texts.map((text) => customWordDedupeKey(text)));
}

function savedWordsByKey(
  words: SavedWordsMap,
): Map<string, { id: string; record: SavedWordRecord }> {
  return new Map(
    Object.entries(words).map(([id, record]) => [customWordDedupeKey(record.text), { id, record }]),
  );
}

/** FNV-1a 32-bit of the Ukrainian dedupe key. */
export function savedWordId(text: string): string {
  const key = customWordDedupeKey(text);
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${SAVED_WORD_ID_PREFIX}${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function getSavedWords(): SavedWordsMap {
  return { ...readWords() };
}

export function getSavedWordCount(): number {
  return Object.keys(readWords()).length;
}

export function getSavedWordTexts(): Record<string, string> {
  return Object.fromEntries(Object.entries(readWords()).map(([id, word]) => [id, word.text]));
}

export function isSavedWordId(wordId: string | null | undefined): boolean {
  return typeof wordId === 'string' && wordId.startsWith(SAVED_WORD_ID_PREFIX);
}

export function classifyHatWord(
  text: string,
  bundledTexts: readonly string[],
): HatWordClassification {
  const key = customWordDedupeKey(text);
  if (key.length === 0) {
    return { state: 'new' };
  }

  if (dedupeKeySet(bundledTexts).has(key)) {
    return { state: 'bundled' };
  }

  const saved = savedWordsByKey(readWords()).get(key);
  if (saved) {
    return { state: 'saved', difficulty: saved.record.difficulty };
  }

  return { state: 'new' };
}

export function saveWords(
  entries: readonly SavedWordRecord[],
  bundledTexts: readonly string[],
): SaveWordsResult {
  const words = readWords();
  const bundledKeys = dedupeKeySet(bundledTexts);
  const existing = savedWordsByKey(words);

  let saved = 0;
  let skipped = 0;

  for (const entry of entries) {
    const normalized = normalizeCustomWord(entry.text);
    if (normalized.length === 0) {
      continue;
    }

    const key = customWordDedupeKey(normalized);
    if (bundledKeys.has(key) || existing.has(key)) {
      skipped += 1;
      continue;
    }

    const id = savedWordId(normalized);
    const record = { text: normalized, difficulty: entry.difficulty };
    words[id] = record;
    existing.set(key, { id, record });
    saved += 1;
  }

  writeWords(words);
  return { saved, skipped };
}

export type UpdateSavedWordResult = 'updated' | 'empty' | 'duplicate' | 'missing';

export function updateSavedWord(
  id: string,
  text: string,
  difficulty: Difficulty,
  bundledTexts: readonly string[],
): UpdateSavedWordResult {
  const words = readWords();
  const current = words[id];
  if (!current) {
    return 'missing';
  }

  const normalized = normalizeCustomWord(text);
  if (normalized.length === 0) {
    return 'empty';
  }

  const nextKey = customWordDedupeKey(normalized);
  if (dedupeKeySet(bundledTexts).has(nextKey)) {
    return 'duplicate';
  }

  const currentKey = customWordDedupeKey(current.text);
  if (nextKey !== currentKey) {
    const taken = savedWordsByKey(words).get(nextKey);
    if (taken && taken.id !== id) {
      return 'duplicate';
    }
    delete words[id];
    words[savedWordId(normalized)] = { text: normalized, difficulty };
    writeWords(words);
    return 'updated';
  }

  if (current.text === normalized && current.difficulty === difficulty) {
    return 'updated';
  }

  words[id] = { text: normalized, difficulty };
  writeWords(words);
  return 'updated';
}

export function deleteSavedWord(id: string): void {
  const words = readWords();
  if (!(id in words)) {
    return;
  }
  delete words[id];
  writeWords(words);
}

export function clearSavedWords(): void {
  clearJson(SAVED_WORDS_KEY);
}
