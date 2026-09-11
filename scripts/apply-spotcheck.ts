import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadBatch,
  SPOTCHECK_DECISIONS_PATH,
  SPOTCHECK_FAIL_RATE,
  type SpotcheckDecisions,
  type WordBatch,
} from './word-batches';
import { formatWordsCsv, parseWordsCsv, type CsvWord } from './words-csv';

export interface ApplySpotcheckResult {
  rejected: number;
  flippedToReview: number;
  failRate: number;
  batchFlipped: boolean;
  missing: string[];
}

export function applySpotcheck(
  words: CsvWord[],
  batch: WordBatch,
  decisions: SpotcheckDecisions,
): ApplySpotcheckResult {
  if (decisions.batch && decisions.batch !== batch.name) {
    throw new Error(`spot-check batch "${decisions.batch}" does not match "${batch.name}"`);
  }

  const byId = new Map(words.map((word) => [word.id, word]));
  const batchIds = new Set(batch.ids);
  const missing: string[] = [];
  const rejectedIds = new Set<string>();
  let rejected = 0;

  for (const item of decisions.items) {
    if (!batchIds.has(item.id)) {
      missing.push(item.id);
      continue;
    }
    const word = byId.get(item.id);
    if (!word) {
      missing.push(item.id);
      continue;
    }
    if (item.action === 'reject') {
      rejectedIds.add(item.id);
      if (word.status !== 'reject') {
        word.status = 'reject';
        word.group = '';
        rejected += 1;
      }
    }
  }

  const sampleSize = decisions.items.length;
  const failRate = sampleSize === 0 ? 0 : rejectedIds.size / sampleSize;
  const batchFlipped = sampleSize > 0 && failRate > SPOTCHECK_FAIL_RATE;
  let flippedToReview = 0;

  if (batchFlipped) {
    for (const id of batch.ids) {
      if (rejectedIds.has(id)) {
        continue;
      }
      const word = byId.get(id);
      if (!word || word.status !== 'core') {
        continue;
      }
      word.status = 'review';
      flippedToReview += 1;
    }
  }

  return {
    rejected,
    flippedToReview,
    failRate,
    batchFlipped,
    missing: [...new Set(missing)],
  };
}

function loadDecisions(path: string): SpotcheckDecisions {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as SpotcheckDecisions;
  if (!Array.isArray(parsed.items)) {
    throw new Error(`${path} must contain an items array`);
  }
  return parsed;
}

function main(): void {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npm run words:apply-spotcheck -- <batch>');
    process.exit(1);
  }

  const csvPath = join(dirname(fileURLToPath(import.meta.url)), 'words-master.csv');
  const batch = loadBatch(batchName);
  const decisions = loadDecisions(SPOTCHECK_DECISIONS_PATH);
  const words = parseWordsCsv(readFileSync(csvPath, 'utf8'));
  const result = applySpotcheck(words, batch, decisions);

  if (result.missing.length > 0) {
    console.error('Unknown spot-check ids:', result.missing.join(', '));
    process.exit(1);
  }

  writeFileSync(csvPath, formatWordsCsv(words), 'utf8');

  console.log('=== APPLY SPOTCHECK ===');
  console.log(`Batch: ${batch.name}`);
  console.log(`Rejected: ${result.rejected}`);
  console.log(`Fail rate: ${(result.failRate * 100).toFixed(1)}%`);
  if (result.batchFlipped) {
    console.log(`Batch flipped to review: ${result.flippedToReview} remaining core rows`);
  } else {
    console.log('Batch kept as core (spot-check passed).');
  }
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('apply-spotcheck.ts')) {
  main();
}
