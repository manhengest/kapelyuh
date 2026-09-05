import { clearJson, getJson, setJson } from './mmkv';

const CUSTOM_WORDS_KEY = 'kapelyukh.customWords.v1';

export type CustomWordsMap = Record<string, string>;
export type AddCustomWordResult = 'added' | 'duplicate' | 'empty';

function readWords(): CustomWordsMap {
  return getJson<CustomWordsMap>(CUSTOM_WORDS_KEY) ?? {};
}

function writeWords(words: CustomWordsMap): void {
  setJson(CUSTOM_WORDS_KEY, words);
}

export function normalizeCustomWord(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function customWordDedupeKey(text: string): string {
  return normalizeCustomWord(text).toLocaleLowerCase('uk-UA');
}

function nextCustomWordId(words: CustomWordsMap): string {
  let max = 0;
  for (const id of Object.keys(words)) {
    const match = /^custom_(\d+)$/.exec(id);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `custom_${max + 1}`;
}

export function getCustomWords(): CustomWordsMap {
  return { ...readWords() };
}

export function getCustomWordIds(): string[] {
  return Object.keys(readWords());
}

export function addCustomWord(text: string): AddCustomWordResult {
  const normalized = normalizeCustomWord(text);
  if (normalized.length === 0) {
    return 'empty';
  }

  const words = readWords();
  const key = customWordDedupeKey(normalized);
  for (const existing of Object.values(words)) {
    if (customWordDedupeKey(existing) === key) {
      return 'duplicate';
    }
  }

  const id = nextCustomWordId(words);
  words[id] = normalized;
  writeWords(words);
  return 'added';
}

export function clearCustomWords(): void {
  clearJson(CUSTOM_WORDS_KEY);
}
