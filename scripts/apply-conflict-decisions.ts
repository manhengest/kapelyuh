import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatWordsCsv, parseWordsCsv } from './words-csv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, 'words-master.csv');
const DECISIONS_PATH = join(__dirname, 'audit', 'word-conflict-decisions.json');

interface ConflictDecisions {
  removeIds: string[];
  groupAssignments: Array<{ group: string; ids: string[] }>;
}

function loadDecisions(): ConflictDecisions {
  const raw = readFileSync(DECISIONS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as ConflictDecisions;
  if (!Array.isArray(parsed.removeIds) || !Array.isArray(parsed.groupAssignments)) {
    throw new Error(`${DECISIONS_PATH} must contain removeIds and groupAssignments arrays`);
  }
  return parsed;
}

function applyDecisions(): { rejected: number; grouped: number; missing: string[] } {
  const decisions = loadDecisions();
  const words = parseWordsCsv(readFileSync(CSV_PATH, 'utf8'));

  const removeIds = new Set(decisions.removeIds);
  const groupById = new Map<string, string>();
  for (const assignment of decisions.groupAssignments) {
    for (const id of assignment.ids) {
      groupById.set(id, assignment.group);
    }
  }

  const missing: string[] = [];
  let rejected = 0;
  let grouped = 0;

  for (const word of words) {
    if (removeIds.has(word.id)) {
      if (word.status !== 'reject') {
        word.status = 'reject';
        rejected += 1;
      }
    }

    const group = groupById.get(word.id);
    if (group) {
      if (word.group !== group) {
        word.group = group;
        grouped += 1;
      }
    }
  }

  for (const id of removeIds) {
    if (!words.some((word) => word.id === id)) missing.push(id);
  }
  for (const [id] of groupById) {
    if (!words.some((word) => word.id === id)) missing.push(id);
  }

  writeFileSync(CSV_PATH, formatWordsCsv(words), 'utf8');

  return { rejected, grouped, missing: [...new Set(missing)] };
}

function main(): void {
  const { rejected, grouped, missing } = applyDecisions();

  if (missing.length > 0) {
    console.error('Missing ids in words-master.csv:', missing.join(', '));
    process.exit(1);
  }

  console.log('=== APPLY CONFLICT DECISIONS ===');
  console.log(`Source: ${DECISIONS_PATH}`);
  console.log(`Updated: ${CSV_PATH}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`Group assignments written: ${grouped}`);
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('apply-conflict-decisions.ts')) {
  main();
}
