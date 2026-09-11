import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadBatch, loadLlmScores, type LlmScore, type WordBatch } from './word-batches';
import {
  ABSTRACTISH_CATEGORIES,
  LLM_OVERRIDES_PATH,
  loadLlmOverrides,
  PLAYABILITY_ELITE_CROCODILE_MIN,
  PLAYABILITY_MIN,
  resetLlmOverrideCache,
  scorePlayability,
  type PlayabilityOverride,
} from './word-playability';
import { formatWordsCsv, parseWordsCsv, type CsvWord, type Difficulty } from './words-csv';
import { normalizeTextKey } from './words-id';

export interface ApplyLlmScoresResult {
  accepted: number;
  rejected: number;
  heuristicFails: number;
  llmFails: number;
  overrideWrites: number;
  overrides: Record<string, PlayabilityOverride>;
  missingScores: string[];
  missingWords: string[];
}

export function llmScorePass(
  difficulty: Difficulty,
  score: Pick<LlmScore, 'alias' | 'crocodile' | 'association'>,
): boolean {
  const crocodileMin = difficulty === 'elite' ? PLAYABILITY_ELITE_CROCODILE_MIN : PLAYABILITY_MIN;
  return (
    score.alias >= PLAYABILITY_MIN &&
    score.crocodile >= crocodileMin &&
    score.association >= PLAYABILITY_MIN
  );
}

export function applyLlmScores(
  words: CsvWord[],
  batch: WordBatch,
  scores: LlmScore[],
): ApplyLlmScoresResult {
  const byId = new Map(words.map((word) => [word.id, word]));
  const scoreById = new Map(scores.map((score) => [score.id, score]));
  const missingScores: string[] = [];
  const missingWords: string[] = [];
  const overrides: Record<string, PlayabilityOverride> = {};
  let accepted = 0;
  let rejected = 0;
  let heuristicFails = 0;
  let llmFails = 0;
  let overrideWrites = 0;

  for (const id of batch.ids) {
    const word = byId.get(id);
    if (!word) {
      missingWords.push(id);
      continue;
    }
    const llm = scoreById.get(id);
    if (!llm) {
      missingScores.push(id);
      continue;
    }

    const heuristic = scorePlayability(word);
    const llmOk = llmScorePass(word.difficulty, llm);
    if (!heuristic.pass) {
      heuristicFails += 1;
    }
    if (!llmOk) {
      llmFails += 1;
    }

    const abstractish = ABSTRACTISH_CATEGORIES.has(word.category);
    const heuristicOk = heuristic.pass || (llmOk && abstractish);

    if (heuristicOk && llmOk) {
      if (abstractish && !heuristic.pass) {
        overrides[normalizeTextKey(word.text)] = {
          alias: llm.alias,
          crocodile: llm.crocodile,
          association: llm.association,
          pass: true,
          reason: `llm ${batch.name}`,
        };
        overrideWrites += 1;
      }
      if (word.status !== 'core') {
        word.status = 'core';
        accepted += 1;
      }
    } else if (word.status !== 'reject') {
      word.status = 'reject';
      word.group = '';
      rejected += 1;
    }
  }

  return {
    accepted,
    rejected,
    heuristicFails,
    llmFails,
    overrideWrites,
    overrides,
    missingScores,
    missingWords,
  };
}

function persistOverrides(partial: Record<string, PlayabilityOverride>): void {
  const merged = { ...loadLlmOverrides(), ...partial };
  writeFileSync(LLM_OVERRIDES_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  resetLlmOverrideCache();
}

function main(): void {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npm run words:apply-scores -- <batch>');
    process.exit(1);
  }

  const csvPath = join(dirname(fileURLToPath(import.meta.url)), 'words-master.csv');
  const batch = loadBatch(batchName);
  const scores = loadLlmScores(batchName);
  const words = parseWordsCsv(readFileSync(csvPath, 'utf8'));
  const result = applyLlmScores(words, batch, scores);

  if (result.missingWords.length > 0) {
    console.error('Missing ids in words-master.csv:', result.missingWords.join(', '));
    process.exit(1);
  }
  if (result.missingScores.length > 0) {
    console.error('Missing LLM scores:', result.missingScores.join(', '));
    process.exit(1);
  }

  if (result.overrideWrites > 0) {
    persistOverrides(result.overrides);
  }
  writeFileSync(csvPath, formatWordsCsv(words), 'utf8');

  console.log('=== APPLY LLM SCORES ===');
  console.log(`Batch: ${batch.name} (${batch.tier}, ${batch.ids.length} ids)`);
  console.log(`Accepted core: ${result.accepted}`);
  console.log(`Rejected: ${result.rejected}`);
  console.log(`Heuristic fails: ${result.heuristicFails}`);
  console.log(`LLM fails: ${result.llmFails}`);
  console.log(`LLM overrides written: ${result.overrideWrites}`);
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('apply-llm-scores.ts')) {
  main();
}
