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
} from '../src/infrastructure/db/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_PATH = join(__dirname, 'words.csv');
const DB_PATH = join(ROOT, 'assets/data/kapelyukh.db');

type Difficulty = 'easy' | 'medium' | 'hard';

interface CsvWord {
  text: string;
  difficulty: Difficulty;
  category: string;
}

const VALID_DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);

function parseCsv(content: string): CsvWord[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('words.csv must contain a header and at least one word');
  }

  const header = lines[0]?.split(',').map((cell) => cell.trim());
  if (header?.join(',') !== 'word,difficulty,category') {
    throw new Error('words.csv header must be: word,difficulty,category');
  }

  const words: CsvWord[] = [];
  const seen = new Set<string>();

  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    if (parts.length < 3) {
      throw new Error(`Invalid CSV row: ${line}`);
    }

    const category = parts.pop()!.trim();
    const difficulty = parts.pop()!.trim() as Difficulty;
    const text = parts.join(',').trim();

    if (!text) {
      throw new Error(`Empty word in row: ${line}`);
    }
    if (!VALID_DIFFICULTIES.has(difficulty)) {
      throw new Error(`Invalid difficulty "${difficulty}" for word "${text}"`);
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate word: ${text}`);
    }
    seen.add(key);
    words.push({ text, difficulty, category });
  }

  return words;
}

function buildDatabase(words: CsvWord[]): void {
  if (words.length < MIN_WORD_COUNT) {
    throw new Error(`Need at least ${MIN_WORD_COUNT} words, got ${words.length}`);
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
  insertPack.run(BUNDLED_PACK_ID, BUNDLED_PACK_NAME, 'bundled', Date.now());

  const insertWord = db.prepare(
    'INSERT INTO words (id, pack_id, text, difficulty, category_id) VALUES (?, ?, ?, ?, ?)',
  );

  const insertMany = db.transaction((entries: CsvWord[]) => {
    entries.forEach((entry, index) => {
      insertWord.run(`w-${index + 1}`, BUNDLED_PACK_ID, entry.text, entry.difficulty, entry.category);
    });
  });

  insertMany(words);
  db.close();

  console.log(`Built ${DB_PATH} with ${words.length} words (schema v${DATABASE_VERSION})`);
}

const csv = readFileSync(CSV_PATH, 'utf8');
const words = parseCsv(csv);
buildDatabase(words);

// Touch a marker so CI can verify the asset exists after build.
writeFileSync(join(ROOT, 'assets/data/.gitkeep'), '');
