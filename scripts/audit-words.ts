import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CANONICAL_CATEGORY_SET, MAX_CARD_LENGTH, parseWordsCsv, type CsvWord } from './words-csv';
import { normalizeTextKey } from './words-id';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(__dirname, 'words-master.csv');
const AUDIT_DIR = join(__dirname, 'audit');
const REPORT_PATH = join(AUDIT_DIR, 'word-audit-report.json');
const REJECTED_PATH = join(AUDIT_DIR, 'words-rejected.csv');

type SuggestedAction = 'keep' | 'group' | 'remove' | 'pack' | 'reject' | 'review' | 'canonical';

interface AuditFinding {
  id: string;
  text: string;
  reason: string;
  suggestedAction: SuggestedAction;
}

interface AuditWord {
  id: string;
  text: string;
  difficulty: string;
  category: string;
  status: string;
  group: string;
}

const SENSITIVE_EXACT = new Set([
  'геноцид',
  'катування',
  'екстремізм',
  'нацизм',
  'фашизм',
  'расизм',
  'сексизм',
  "секс без зобов'язань",
]);

const RUSSIANISM_STOPLIST = new Set([
  'паспорт',
  'область',
  'район',
  // Keep empty-ish: only flag clear russianisms if present.
]);

function toAuditWords(): AuditWord[] {
  return parseWordsCsv(readFileSync(CSV_PATH, 'utf8')).map(modernToAudit);
}

function modernToAudit(word: CsvWord): AuditWord {
  return {
    id: word.id,
    text: word.text,
    difficulty: word.difficulty,
    category: word.category,
    status: word.status,
    group: word.group,
  };
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prevDiag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length]!;
}

function audit(words: AuditWord[]): { findings: AuditFinding[]; rejected: AuditFinding[] } {
  const findings: AuditFinding[] = [];
  const rejected: AuditFinding[] = [];

  const byNorm = new Map<string, AuditWord[]>();
  for (const word of words) {
    const key = normalizeTextKey(word.text);
    const list = byNorm.get(key) ?? [];
    list.push(word);
    byNorm.set(key, list);
  }

  for (const [, members] of byNorm) {
    if (members.length < 2) continue;
    const texts = members.map((word) => word.text).join(' | ');
    for (const word of members) {
      const finding: AuditFinding = {
        id: word.id,
        text: word.text,
        reason: `spelling_variant_of: ${texts}`,
        suggestedAction: 'canonical',
      };
      findings.push(finding);
      rejected.push({
        ...finding,
        suggestedAction: 'remove',
        reason: `duplicate_spelling: ${texts}`,
      });
    }
  }

  for (const word of words) {
    if (!CANONICAL_CATEGORY_SET.has(word.category)) {
      findings.push({
        id: word.id,
        text: word.text,
        reason: `unknown_category: ${word.category}`,
        suggestedAction: 'review',
      });
    }

    if (word.text.length > MAX_CARD_LENGTH) {
      findings.push({
        id: word.id,
        text: word.text,
        reason: `card_too_long: ${word.text.length}`,
        suggestedAction: 'review',
      });
    }

    if (SENSITIVE_EXACT.has(word.text) || SENSITIVE_EXACT.has(word.text.toLowerCase())) {
      findings.push({
        id: word.id,
        text: word.text,
        reason: 'sensitive_or_adult',
        suggestedAction: 'pack',
      });
      if (word.status === 'core') {
        rejected.push({
          id: word.id,
          text: word.text,
          reason: 'sensitive_or_adult',
          suggestedAction: 'pack',
        });
      }
    }

    if (RUSSIANISM_STOPLIST.has(word.text.toLowerCase())) {
      findings.push({
        id: word.id,
        text: word.text,
        reason: 'possible_russianism',
        suggestedAction: 'review',
      });
    }

    if (/[ыэъё]/i.test(word.text) || /[a-z]/i.test(word.text)) {
      findings.push({
        id: word.id,
        text: word.text,
        reason: 'forbidden_or_latin_chars',
        suggestedAction: 'review',
      });
    }
  }

  // Near-duplicates: bucket by first 3 chars, Levenshtein distance 1, length >= 5
  const buckets = new Map<string, AuditWord[]>();
  for (const word of words) {
    const key = normalizeTextKey(word.text);
    if (key.length < 5) continue;
    const prefix = key.slice(0, 3);
    const list = buckets.get(prefix) ?? [];
    list.push(word);
    buckets.set(prefix, list);
  }
  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      const a = bucket[i]!;
      const aKey = normalizeTextKey(a.text);
      for (let j = i + 1; j < bucket.length; j += 1) {
        const b = bucket[j]!;
        const bKey = normalizeTextKey(b.text);
        if (aKey === bKey) continue;
        if (Math.abs(aKey.length - bKey.length) > 1) continue;
        if (levenshtein(aKey, bKey) === 1) {
          findings.push({
            id: a.id,
            text: a.text,
            reason: `possible_confusion_with: ${b.text}`,
            suggestedAction: 'group',
          });
          findings.push({
            id: b.id,
            text: b.text,
            reason: `possible_confusion_with: ${a.text}`,
            suggestedAction: 'group',
          });
        }
      }
    }
  }

  // Orphan groups (only one member)
  const byGroup = new Map<string, AuditWord[]>();
  for (const word of words) {
    if (!word.group) continue;
    const list = byGroup.get(word.group) ?? [];
    list.push(word);
    byGroup.set(word.group, list);
  }
  for (const [group, members] of byGroup) {
    if (members.length === 1) {
      const word = members[0]!;
      findings.push({
        id: word.id,
        text: word.text,
        reason: `orphan_group: ${group}`,
        suggestedAction: 'review',
      });
    }
  }

  // Deduplicate findings by id+reason
  const seen = new Set<string>();
  const uniqueFindings = findings.filter((finding) => {
    const key = `${finding.id}|${finding.reason}|${finding.suggestedAction}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const seenRejected = new Set<string>();
  const uniqueRejected = rejected.filter((finding) => {
    const key = `${finding.id}|${finding.reason}`;
    if (seenRejected.has(key)) return false;
    seenRejected.add(key);
    return true;
  });

  return { findings: uniqueFindings, rejected: uniqueRejected };
}

function main(): void {
  const words = toAuditWords();
  const { findings, rejected } = audit(words);

  mkdirSync(AUDIT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(findings, null, 2) + '\n', 'utf8');
  writeFileSync(
    REJECTED_PATH,
    [
      'id,text,reason,suggestedAction',
      ...rejected.map((row) => `${row.id},${row.text},${row.reason},${row.suggestedAction}`),
    ].join('\n') + '\n',
    'utf8',
  );

  const byAction = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.suggestedAction] = (acc[finding.suggestedAction] ?? 0) + 1;
    return acc;
  }, {});

  console.log('=== WORD AUDIT REPORT ===');
  console.log(`Source: ${CSV_PATH}`);
  console.log(`Total words: ${words.length}`);
  console.log(`Findings: ${findings.length}`);
  console.log(`Proposed rejected/moved: ${rejected.length}`);
  console.log('By suggestedAction:');
  for (const [action, count] of Object.entries(byAction).sort()) {
    console.log(`  ${action}: ${count}`);
  }
  console.log(`Wrote ${REPORT_PATH}`);
  console.log(`Wrote ${REJECTED_PATH}`);
  console.log(`Workspace root marker: ${ROOT}`);
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('audit-words.ts')) {
  main();
}
