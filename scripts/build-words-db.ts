import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';

import {
  BUNDLED_PACK_ID,
  BUNDLED_PACK_NAME,
  CREATE_SCHEMA_SQL,
  DATABASE_VERSION,
  MIN_WORD_COUNT,
  THEMATIC_PACK_ID,
  THEMATIC_PACK_NAME,
} from '../src/infrastructure/db/schema';

import { parseWordsCsv, type CsvWord } from './words-csv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(__dirname, 'words-master.csv');
const DB_PATH = join(ROOT, 'assets/data/kapelyukh.db');

function isShippedWord(word: CsvWord): boolean {
  return word.status === 'core' || word.status === 'pack';
}

function packIdFor(word: CsvWord): string {
  return word.status === 'pack' ? THEMATIC_PACK_ID : BUNDLED_PACK_ID;
}

function buildDatabase(words: CsvWord[]): void {
  const production = words.filter(isShippedWord);

  if (production.filter((word) => word.status === 'core').length < MIN_WORD_COUNT) {
    throw new Error(
      `Need at least ${MIN_WORD_COUNT} core words, got ${production.filter((w) => w.status === 'core').length}`,
    );
  }

  mkdirSync(dirname(DB_PATH), { recursive: true });
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);
  db.exec(CREATE_SCHEMA_SQL);
  db.exec(`PRAGMA user_version = ${DATABASE_VERSION}`);

  const insertPack = db.prepare(
    'INSERT INTO packs (id, name, source, created_at) VALUES (?, ?, ?, ?)',
  );
  const now = Date.now();
  insertPack.run(BUNDLED_PACK_ID, BUNDLED_PACK_NAME, 'bundled', now);

  const hasPackWords = production.some((word) => word.status === 'pack');
  if (hasPackWords) {
    insertPack.run(THEMATIC_PACK_ID, THEMATIC_PACK_NAME, 'bundled', now);
  }

  const insertWord = db.prepare(
    'INSERT INTO words (id, pack_id, text, difficulty, category_id, group_id) VALUES (?, ?, ?, ?, ?, ?)',
  );

  const insertMany = db.transaction((entries: CsvWord[]) => {
    for (const entry of entries) {
      insertWord.run(
        entry.id,
        packIdFor(entry),
        entry.text,
        entry.difficulty,
        entry.category,
        entry.group || null,
      );
    }
  });

  insertMany(production);
  db.close();

  const coreCount = production.filter((word) => word.status === 'core').length;
  const packCount = production.filter((word) => word.status === 'pack').length;
  const excluded = words.length - production.length;
  console.log(
    `Built ${DB_PATH} with ${coreCount} core + ${packCount} pack / ${words.length} master (${excluded} reject/review) (schema v${DATABASE_VERSION})`,
  );
}

const csv = readFileSync(CSV_PATH, 'utf8');
const words = parseWordsCsv(csv);
buildDatabase(words);

writeFileSync(join(ROOT, 'assets/data/.gitkeep'), '');
