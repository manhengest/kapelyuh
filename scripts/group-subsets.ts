import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { latinGroupSlug } from './apply-elite-decisions';
import { cardTokens } from './validate-words';
import { ELITE_FUNCTION_WORDS, formatWordsCsv, parseWordsCsv, type CsvWord } from './words-csv';

function isActive(word: CsvWord): boolean {
  return word.status === 'core' || word.status === 'pack';
}

/**
 * For every active multi-token card, find an active single-word card equal to
 * one content token. Copy that word's group, or create group = Latin key of
 * that word when both are ungrouped. Does not overwrite an existing phrase group.
 */
export function groupSubsets(words: CsvWord[]): number {
  const active = words.filter(isActive);
  const singlesByToken = new Map<string, CsvWord>();
  for (const word of active) {
    const tokens = cardTokens(word.text);
    if (tokens.length === 1) {
      singlesByToken.set(tokens[0]!, word);
    }
  }

  let changed = 0;
  for (const word of active) {
    const tokens = cardTokens(word.text);
    if (tokens.length < 2) {
      continue;
    }
    if (word.group) {
      continue;
    }

    let match: CsvWord | undefined;
    for (const token of tokens) {
      if (ELITE_FUNCTION_WORDS.has(token)) {
        continue;
      }
      const single = singlesByToken.get(token);
      if (single) {
        match = single;
        break;
      }
    }
    if (!match) {
      continue;
    }

    if (match.group) {
      word.group = match.group;
      changed += 1;
      continue;
    }

    const group = latinGroupSlug(match.text);
    match.group = group;
    word.group = group;
    changed += 2;
  }

  return changed;
}

function main(): void {
  const csvPath = join(dirname(fileURLToPath(import.meta.url)), 'words-master.csv');
  const words = parseWordsCsv(readFileSync(csvPath, 'utf8'));
  const changed = groupSubsets(words);
  writeFileSync(csvPath, formatWordsCsv(words), 'utf8');
  console.log('=== GROUP SUBSETS ===');
  console.log(`Group cells written: ${changed}`);
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('group-subsets.ts')) {
  main();
}
