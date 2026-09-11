import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cardTokens, eliteShapeError, isContiguousSubset } from './validate-words';
import { formatWordsCsv, parseWordsCsv, type CsvWord } from './words-csv';
import { stableWordId } from './words-id';

export type EliteDecisionAction =
  | 'accept'
  | 'reject'
  | 'rewrite'
  | 'move-elite'
  | 'keep-hard'
  | 'accept-hard';

export interface EliteDecisionItem {
  id: string;
  action: EliteDecisionAction;
  text?: string;
  accept?: boolean;
}

export interface EliteDecisions {
  items: EliteDecisionItem[];
  groupAssignments?: Array<{ group: string; ids: string[] }>;
}

export interface ApplyEliteResult {
  accepted: number;
  rejected: number;
  rewritten: number;
  movedElite: number;
  acceptedHard: number;
  grouped: number;
  missing: string[];
}

const LATIN_FROM_UK: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
  "'": '',
  '’': '',
  ʼ: '',
};

export function latinGroupSlug(text: string): string {
  let slug = '';
  for (const char of text.toLocaleLowerCase('uk-UA')) {
    if (/[a-z0-9]/.test(char)) {
      slug += char;
    } else {
      slug += LATIN_FROM_UK[char] ?? '';
    }
    if (slug.length >= 10) {
      break;
    }
  }
  const trimmed = slug.replace(/_+/g, '').slice(0, 10);
  return trimmed.length >= 2 ? trimmed : `g${stableWordId(text).slice(-4)}`;
}

function byId(words: CsvWord[]): Map<string, CsvWord> {
  return new Map(words.map((word) => [word.id, word]));
}

function applyRewrite(word: CsvWord, nextText: string): void {
  const trimmed = nextText.trim();
  if (!trimmed) {
    throw new Error(`rewrite for ${word.id} is missing text`);
  }
  word.text = trimmed;
  word.id = stableWordId(trimmed);
  const shape = word.difficulty === 'elite' ? eliteShapeError(word) : null;
  if (shape) {
    throw new Error(shape);
  }
}

function assignGroup(words: CsvWord[], group: string, ids: string[]): number {
  const index = byId(words);
  let changed = 0;
  for (const id of ids) {
    const word = index.get(id);
    if (!word) {
      continue;
    }
    if (word.group !== group) {
      word.group = group;
      changed += 1;
    }
  }
  return changed;
}

function autoGroupSubsets(words: CsvWord[]): number {
  const active = words.filter((word) => word.status === 'core' || word.status === 'pack');
  const tokenized = active.map((word) => ({ word, tokens: cardTokens(word.text) }));
  let grouped = 0;

  for (const candidate of tokenized) {
    if (candidate.word.difficulty !== 'elite') {
      continue;
    }

    let best: (typeof tokenized)[number] | undefined;
    for (const other of tokenized) {
      if (other.word.id === candidate.word.id) {
        continue;
      }
      if (!isContiguousSubset(other.tokens, candidate.tokens)) {
        continue;
      }
      if (!best || other.tokens.length > best.tokens.length) {
        best = other;
      }
    }

    if (!best) {
      continue;
    }

    const group = best.word.group || candidate.word.group || latinGroupSlug(best.word.text);
    grouped += assignGroup(words, group, [candidate.word.id, best.word.id]);
  }

  return grouped;
}

export function applyEliteDecisions(words: CsvWord[], decisions: EliteDecisions): ApplyEliteResult {
  const index = byId(words);
  const missing: string[] = [];
  let accepted = 0;
  let rejected = 0;
  let rewritten = 0;
  let movedElite = 0;
  let acceptedHard = 0;

  for (const item of decisions.items) {
    const word = index.get(item.id);
    if (!word) {
      missing.push(item.id);
      continue;
    }

    switch (item.action) {
      case 'accept': {
        if (word.status !== 'core' || word.difficulty !== 'elite') {
          word.status = 'core';
          word.difficulty = 'elite';
          accepted += 1;
        }
        break;
      }
      case 'reject': {
        if (word.status !== 'reject') {
          word.status = 'reject';
          word.group = '';
          rejected += 1;
        }
        break;
      }
      case 'rewrite': {
        if (!item.text) {
          throw new Error(`rewrite for ${item.id} is missing text`);
        }
        const previousId = word.id;
        applyRewrite(word, item.text);
        index.delete(previousId);
        index.set(word.id, word);
        rewritten += 1;
        if (item.accept) {
          word.status = 'core';
          word.difficulty = 'elite';
          accepted += 1;
        }
        break;
      }
      case 'move-elite': {
        if (word.difficulty !== 'elite') {
          word.difficulty = 'elite';
          word.status = 'core';
          movedElite += 1;
        }
        break;
      }
      case 'keep-hard': {
        break;
      }
      case 'accept-hard': {
        if (word.status !== 'core' || word.difficulty !== 'hard') {
          word.status = 'core';
          word.difficulty = 'hard';
          acceptedHard += 1;
        }
        break;
      }
      default: {
        const neverAction: never = item.action;
        throw new Error(`unknown elite action: ${String(neverAction)}`);
      }
    }
  }

  let grouped = 0;
  for (const assignment of decisions.groupAssignments ?? []) {
    grouped += assignGroup(words, assignment.group, assignment.ids);
  }
  grouped += autoGroupSubsets(words);

  return {
    accepted,
    rejected,
    rewritten,
    movedElite,
    acceptedHard,
    grouped,
    missing: [...new Set(missing)],
  };
}

function loadDecisions(path: string): EliteDecisions {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as EliteDecisions;
  if (!Array.isArray(parsed.items)) {
    throw new Error(`${path} must contain an items array`);
  }
  return parsed;
}

function main(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const csvPath = join(scriptDir, 'words-master.csv');
  const decisionsPath = join(scriptDir, 'audit', 'elite-review-decisions.json');
  const decisions = loadDecisions(decisionsPath);
  const words = parseWordsCsv(readFileSync(csvPath, 'utf8'));
  const result = applyEliteDecisions(words, decisions);

  if (result.missing.length > 0) {
    console.error('Missing ids in words-master.csv:', result.missing.join(', '));
    process.exit(1);
  }

  writeFileSync(csvPath, formatWordsCsv(words), 'utf8');

  console.log('=== APPLY ELITE DECISIONS ===');
  console.log(`Source: ${decisionsPath}`);
  console.log(`Updated: ${csvPath}`);
  console.log(`Accepted elite: ${result.accepted}`);
  console.log(`Moved hard → elite: ${result.movedElite}`);
  console.log(`Accepted hard: ${result.acceptedHard}`);
  console.log(`Rejected: ${result.rejected}`);
  console.log(`Rewritten: ${result.rewritten}`);
  console.log(`Group cells written: ${result.grouped}`);
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('apply-elite-decisions.ts')) {
  main();
}
