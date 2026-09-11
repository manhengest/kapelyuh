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

function readWords(): SavedWordsMap {
  return getJson<SavedWordsMap>(SAVED_WORDS_KEY) ?? {};
}

function writeWords(words: SavedWordsMap): void {
  setJson(SAVED_WORDS_KEY, words);
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

export function saveWords(
  texts: readonly string[],
  difficulty: Difficulty,
  bundledTexts: readonly string[],
): SaveWordsResult {
  const words = readWords();
  const bundledKeys = new Set(bundledTexts.map((text) => customWordDedupeKey(text)));
  const existingKeys = new Set(Object.values(words).map((word) => customWordDedupeKey(word.text)));

  let saved = 0;
  let skipped = 0;

  for (const raw of texts) {
    const normalized = normalizeCustomWord(raw);
    if (normalized.length === 0) {
      continue;
    }

    const key = customWordDedupeKey(normalized);
    if (bundledKeys.has(key) || existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    words[savedWordId(normalized)] = { text: normalized, difficulty };
    existingKeys.add(key);
    saved += 1;
  }

  writeWords(words);
  return { saved, skipped };
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
