import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPlayabilityReport,
  isPlayabilityCheckedStatus,
  scorePlayability,
  summarizePlayabilityReport,
} from './word-playability';
import {
  CANONICAL_CATEGORIES,
  CANONICAL_CATEGORY_SET,
  MAX_CARD_LENGTH,
  parseWordsCsv,
  type CsvWord,
  type Difficulty,
  type WordStatus,
} from './words-csv';
import { normalizeTextKey, stableWordId } from './words-id';

const CORE_WARN_BELOW = 5000;
const HARD_WARN_BELOW = 500;

export interface ValidateWordsOptions {
  playability?: boolean;
}

function countBy<K extends string>(words: CsvWord[], key: (word: CsvWord) => K): Record<K, number> {
  const counts = {} as Record<K, number>;
  for (const word of words) {
    const value = key(word);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function pad(label: string, width: number): string {
  return label.padEnd(width, ' ');
}

function formatCountMap(counts: Record<string, number>, keys: string[]): string {
  return keys
    .map((key) => `${pad(key + ':', 14)}${String(counts[key] ?? 0).padStart(4)}`)
    .join('\n  ');
}

export function validateWords(
  words: CsvWord[],
  options: ValidateWordsOptions = {},
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const seenNorm = new Map<string, CsvWord>();
  const groupMembers = new Map<string, CsvWord[]>();

  for (const word of words) {
    if (!CANONICAL_CATEGORY_SET.has(word.category)) {
      errors.push(`unknown category "${word.category}": ${word.text}`);
    }

    if (word.id !== stableWordId(word.text)) {
      errors.push(
        `unstable id for "${word.text}": got ${word.id}, expected ${stableWordId(word.text)}`,
      );
    }

    if (word.text.length > MAX_CARD_LENGTH) {
      errors.push(`card too long (${word.text.length}): ${word.text}`);
    }

    if (/[ыэъё]/i.test(word.text)) {
      errors.push(`forbidden russian letters: ${word.text}`);
    }

    if (/[a-zA-Z]/.test(word.text)) {
      warnings.push(`latin characters: ${word.text}`);
    }

    if (/[\u0000-\u001f]/.test(word.text)) {
      errors.push(`control characters: ${word.text}`);
    }

    const norm = normalizeTextKey(word.text);
    const existing = seenNorm.get(norm);
    if (existing && existing.status !== 'reject' && word.status !== 'reject') {
      errors.push(`normalized duplicate: "${existing.text}" / "${word.text}"`);
    }
    if (!existing || existing.status === 'reject') {
      seenNorm.set(norm, word);
    }

    if (word.group) {
      const list = groupMembers.get(word.group) ?? [];
      list.push(word);
      groupMembers.set(word.group, list);
    }

    if (options.playability && isPlayabilityCheckedStatus(word.status)) {
      const score = scorePlayability(word);
      if (!score.pass) {
        errors.push(
          `playability fail (alias=${score.alias}, crocodile=${score.crocodile}, association=${score.association}, min=${score.min}): ${word.text}`,
        );
      }
    }
  }

  for (const [group, members] of groupMembers) {
    const active = members.filter((word) => word.status === 'core' || word.status === 'pack');
    if (active.length === 1) {
      warnings.push(`orphan group "${group}": ${active[0]!.text}`);
    }
    if (active.length === 0 && members.length > 0) {
      warnings.push(`group "${group}" has no core/pack members`);
    }
  }

  const core = words.filter((word) => word.status === 'core');
  const coreByDifficulty = countBy(core, (word) => word.difficulty);

  if (core.length < CORE_WARN_BELOW) {
    warnings.push(`core count ${core.length} < ${CORE_WARN_BELOW}`);
  }
  if ((coreByDifficulty.hard ?? 0) < HARD_WARN_BELOW) {
    warnings.push(`hard core ${coreByDifficulty.hard ?? 0} < ${HARD_WARN_BELOW}`);
  }

  return { errors, warnings };
}

function printValidationReport(words: CsvWord[], errors: string[], warnings: string[]): void {
  const byStatus = countBy(words, (word) => word.status);
  const byDifficultyAll = countBy(words, (word) => word.difficulty);
  const core = words.filter((word) => word.status === 'core');
  const coreByDifficulty = countBy(core, (word) => word.difficulty);
  const byCategory = countBy(words, (word) => word.category);

  const difficultyOrder: Difficulty[] = ['easy', 'medium', 'hard'];
  const statusOrder: WordStatus[] = ['core', 'pack', 'review', 'reject'];

  const groups = new Set(words.map((word) => word.group).filter(Boolean));

  console.log('=== VALIDATION REPORT ===');
  console.log(
    `Total rows: ${words.length} | Core: ${byStatus.core ?? 0} | Pack: ${byStatus.pack ?? 0} | Review: ${byStatus.review ?? 0} | Reject: ${byStatus.reject ?? 0}`,
  );
  console.log(`Confusion groups: ${groups.size}`);
  console.log('');
  console.log('All rows by difficulty:');
  console.log(`  ${formatCountMap(byDifficultyAll, difficultyOrder)}`);
  console.log('');
  console.log('Core by difficulty:');
  console.log(
    `  easy:   ${String(coreByDifficulty.easy ?? 0).padStart(4)}  medium: ${String(coreByDifficulty.medium ?? 0).padStart(4)}  hard: ${String(coreByDifficulty.hard ?? 0).padStart(4)}`,
  );
  console.log('');
  console.log('By status:');
  console.log(`  ${formatCountMap(byStatus, statusOrder)}`);
  console.log('');
  console.log('By category:');
  const categoryLines = CANONICAL_CATEGORIES.map(
    (category) => `  ${pad(category + ':', 16)}${String(byCategory[category] ?? 0).padStart(4)}`,
  ).join('\n');
  console.log(categoryLines);
  console.log('');
  console.log(`ERRORS (${errors.length}):`);
  if (errors.length === 0) {
    console.log('  [none]');
  } else {
    for (const error of errors) {
      console.log(`  ${error}`);
    }
  }
  console.log('');
  console.log(`WARNINGS (${warnings.length}):`);
  if (warnings.length === 0) {
    console.log('  [none]');
  } else {
    for (const warning of warnings) {
      console.log(`  ${warning}`);
    }
  }
}

export function runPlayabilityReport(words: CsvWord[]): {
  reportPath: string;
  summary: ReturnType<typeof summarizePlayabilityReport>;
  entries: ReturnType<typeof buildPlayabilityReport>;
} {
  const entries = buildPlayabilityReport(words);
  const summary = summarizePlayabilityReport(entries);
  const auditDir = join(dirname(fileURLToPath(import.meta.url)), 'audit');
  mkdirSync(auditDir, { recursive: true });
  const reportPath = join(auditDir, 'playability-report.json');
  writeFileSync(reportPath, JSON.stringify({ summary, entries }, null, 2) + '\n', 'utf8');

  console.log('=== PLAYABILITY REPORT ===');
  console.log(`Checked: ${summary.total} (core/pack/review)`);
  console.log(`Passed: ${summary.passed} | Failed: ${summary.failed}`);
  console.log('');
  console.log('Failed by category:');
  const failedCategories = Object.entries(summary.failedByCategory).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  if (failedCategories.length === 0) {
    console.log('  [none]');
  } else {
    for (const [category, count] of failedCategories) {
      console.log(`  ${pad(category + ':', 16)}${String(count).padStart(4)}`);
    }
  }
  console.log('');
  console.log('Sample failures (first 20):');
  const failures = entries.filter((entry) => !entry.pass).slice(0, 20);
  if (failures.length === 0) {
    console.log('  [none]');
  } else {
    for (const entry of failures) {
      console.log(
        `  ${entry.text} (${entry.category}) alias=${entry.alias} crocodile=${entry.crocodile} association=${entry.association}`,
      );
    }
  }
  console.log('');
  console.log(`Wrote ${reportPath}`);

  return { reportPath, summary, entries };
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const playabilityReport = args.has('--playability-report');
  const playabilityStrict = args.has('--playability');

  const csvPath = join(dirname(fileURLToPath(import.meta.url)), 'words-master.csv');
  const csv = readFileSync(csvPath, 'utf8');
  const words = parseWordsCsv(csv);

  if (playabilityReport) {
    runPlayabilityReport(words);
    return;
  }

  const { errors, warnings } = validateWords(words, { playability: playabilityStrict });
  printValidationReport(words, errors, warnings);

  if (errors.length > 0) {
    process.exit(1);
  }
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('validate-words.ts')) {
  main();
}
