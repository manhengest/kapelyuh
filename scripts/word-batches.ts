import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CsvWord, Difficulty } from './words-csv';

export type BatchTier = Extract<Difficulty, 'hard' | 'elite'>;

export interface WordBatch {
  name: string;
  tier: BatchTier;
  ids: string[];
}

export interface LlmScore {
  id: string;
  alias: number;
  crocodile: number;
  association: number;
}

export interface SpotcheckDecisionItem {
  id: string;
  action: 'accept' | 'reject';
}

export interface SpotcheckDecisions {
  batch: string;
  items: SpotcheckDecisionItem[];
}

function resolveScriptDir(): string {
  const metaUrl = import.meta.url;
  if (typeof metaUrl === 'string' && metaUrl.length > 0) {
    return dirname(fileURLToPath(metaUrl));
  }
  return join(process.cwd(), 'scripts');
}

const SCRIPT_DIR = resolveScriptDir();
export const AUDIT_DIR = join(SCRIPT_DIR, 'audit');
export const BATCHES_DIR = join(AUDIT_DIR, 'batches');
export const LLM_SCORES_DIR = join(AUDIT_DIR, 'llm-scores');
export const SPOTCHECK_DECISIONS_PATH = join(AUDIT_DIR, 'spotcheck-decisions.json');
export const SPOTCHECK_PICKER_PATH = join(AUDIT_DIR, 'spotcheck-picker.html');

export const SPOTCHECK_FAIL_RATE = 0.05;
export const DEFAULT_SPOTCHECK_PCT = 10;

export function batchPath(name: string): string {
  return join(BATCHES_DIR, `${name}.json`);
}

export function llmScoresPath(name: string): string {
  return join(LLM_SCORES_DIR, `${name}.json`);
}

export function loadBatch(name: string): WordBatch {
  const parsed = JSON.parse(readFileSync(batchPath(name), 'utf8')) as WordBatch;
  if (!parsed.name || (parsed.tier !== 'hard' && parsed.tier !== 'elite')) {
    throw new Error(`${batchPath(name)} must have name and tier hard|elite`);
  }
  if (!Array.isArray(parsed.ids)) {
    throw new Error(`${batchPath(name)} must contain an ids array`);
  }
  return parsed;
}

export function loadLlmScores(name: string): LlmScore[] {
  const parsed = JSON.parse(readFileSync(llmScoresPath(name), 'utf8')) as unknown;
  const scores = Array.isArray(parsed) ? parsed : (parsed as { scores?: LlmScore[] }).scores;
  if (!Array.isArray(scores)) {
    throw new Error(
      `${llmScoresPath(name)} must be an array of { id, alias, crocodile, association }`,
    );
  }
  return scores as LlmScore[];
}

export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded sample of `pct` percent of ids. Result is sorted for stable picker order. */
export function sampleIds(ids: string[], pct: number, seedKey: string): string[] {
  if (ids.length === 0) {
    return [];
  }
  const unique = [...new Set(ids)];
  const rng = mulberry32(hashSeed(seedKey));
  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const current = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = current;
  }
  const count = Math.max(1, Math.round((unique.length * pct) / 100));
  return shuffled.slice(0, Math.min(count, shuffled.length)).sort((a, b) => a.localeCompare(b));
}

export function insertBeforeReject(words: CsvWord[], added: CsvWord[]): CsvWord[] {
  const rejectIndex = words.findIndex((word) => word.status === 'reject');
  if (rejectIndex === -1) {
    return [...words, ...added];
  }
  return [...words.slice(0, rejectIndex), ...added, ...words.slice(rejectIndex)];
}

export function parseSpotcheckArgs(argv: string[]): { batch?: string; pct: number } | null {
  const args = argv.slice(2);
  if (!args.includes('--spotcheck')) {
    return null;
  }
  let batch: string | undefined;
  let pct = DEFAULT_SPOTCHECK_PCT;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg === '--spotcheck') {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        batch = next;
        i += 1;
      }
      continue;
    }
    if (arg === '--pct') {
      const next = args[i + 1];
      pct = Number(next);
      i += 1;
      continue;
    }
    if (!arg.startsWith('--') && !batch) {
      batch = arg;
    }
  }
  return { batch, pct };
}

export function selectSpotcheckCards(
  words: CsvWord[],
  batchIds: string[],
  batchName: string,
  pct: number,
): CsvWord[] {
  const batchSet = new Set(batchIds);
  const coreIds = words
    .filter((word) => batchSet.has(word.id) && word.status === 'core')
    .map((word) => word.id);
  const sampled = new Set(sampleIds(coreIds, pct, `spotcheck:${batchName}:${pct}`));
  return words.filter((word) => sampled.has(word.id));
}
