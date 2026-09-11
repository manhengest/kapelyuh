import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ELITE_SEED, HARD_IDIOM_TEXTS, HARD_REFILL_SEED } from './elite-seed-data';
import { eliteShapeError } from './validate-words';
import { scorePlayability } from './word-playability';
import {
  formatWordsCsv,
  MAX_ELITE_CARD_LENGTH,
  parseWordsCsv,
  type CsvWord,
  type Difficulty,
} from './words-csv';
import { normalizeTextKey, stableWordId } from './words-id';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, 'words-master.csv');

function occupiedKeys(words: CsvWord[]): Set<string> {
  const keys = new Set<string>();
  for (const word of words) {
    keys.add(normalizeTextKey(word.text));
  }
  return keys;
}

function canAdd(
  text: string,
  category: string,
  difficulty: Difficulty,
  keys: Set<string>,
): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  if (trimmed.includes(',')) return 'comma';
  if (/[ыэъё]/i.test(trimmed)) return 'russian letters';
  if (trimmed.length > (difficulty === 'elite' ? MAX_ELITE_CARD_LENGTH : 28)) return 'too long';
  const key = normalizeTextKey(trimmed);
  if (keys.has(key)) return 'duplicate';
  const draft: CsvWord = {
    id: stableWordId(trimmed),
    text: trimmed,
    difficulty,
    category,
    status: 'review',
    group: '',
  };
  if (difficulty === 'elite') {
    const shape = eliteShapeError(draft);
    if (shape) return shape;
  }
  const score = scorePlayability(draft);
  if (!score.pass) {
    return `playability alias=${score.alias} crocodile=${score.crocodile} association=${score.association}`;
  }
  return null;
}

function insertBeforeReject(words: CsvWord[], added: CsvWord[]): CsvWord[] {
  const rejectIndex = words.findIndex((word) => word.status === 'reject');
  if (rejectIndex === -1) {
    return [...words, ...added];
  }
  return [...words.slice(0, rejectIndex), ...added, ...words.slice(rejectIndex)];
}

export function seedEliteReview(words: CsvWord[]): {
  added: CsvWord[];
  skipped: number;
  hardIdiomsFound: number;
} {
  const keys = occupiedKeys(words);
  const added: CsvWord[] = [];
  let skipped = 0;

  for (const [text, category] of ELITE_SEED) {
    const reason = canAdd(text, category, 'elite', keys);
    if (reason) {
      skipped += 1;
      continue;
    }
    const row: CsvWord = {
      id: stableWordId(text.trim()),
      text: text.trim(),
      difficulty: 'elite',
      category,
      status: 'review',
      group: '',
    };
    keys.add(normalizeTextKey(row.text));
    added.push(row);
  }

  for (const [text, category] of HARD_REFILL_SEED) {
    const reason = canAdd(text, category, 'hard', keys);
    if (reason) {
      skipped += 1;
      continue;
    }
    const row: CsvWord = {
      id: stableWordId(text.trim()),
      text: text.trim(),
      difficulty: 'hard',
      category,
      status: 'review',
      group: '',
    };
    keys.add(normalizeTextKey(row.text));
    added.push(row);
  }

  const existingTexts = new Set(words.map((word) => word.text));
  const hardIdiomsFound = HARD_IDIOM_TEXTS.filter((text) => existingTexts.has(text)).length;

  return { added, skipped, hardIdiomsFound };
}

function main(): void {
  const words = parseWordsCsv(readFileSync(CSV_PATH, 'utf8'));
  const { added, skipped, hardIdiomsFound } = seedEliteReview(words);
  const eliteAdded = added.filter((word) => word.difficulty === 'elite').length;
  const hardAdded = added.filter((word) => word.difficulty === 'hard').length;
  writeFileSync(CSV_PATH, formatWordsCsv(insertBeforeReject(words, added)), 'utf8');
  console.log(`Added ${eliteAdded} elite review + ${hardAdded} hard review; skipped ${skipped}`);
  console.log(
    `Hard idiom candidates present in CSV: ${hardIdiomsFound}/${HARD_IDIOM_TEXTS.length}`,
  );
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('seed-elite-review.ts')) {
  main();
}
