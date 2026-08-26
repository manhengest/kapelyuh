export const CSV_HEADER = 'id,text,difficulty,category,status,group';

export const CANONICAL_CATEGORIES = [
  'animals',
  'nature',
  'food',
  'drinks',
  'body',
  'clothing',
  'home',
  'tools',
  'transport',
  'technology',
  'places',
  'cities',
  'travel',
  'family',
  'people',
  'professions',
  'sports',
  'games',
  'music',
  'movies',
  'tv',
  'internet',
  'brands',
  'school',
  'work',
  'holidays',
  'events',
  'history',
  'science',
  'society',
  'emotions',
  'personality',
  'relationships',
  'actions',
  'behavior',
  'abstract',
] as const;

export const CANONICAL_CATEGORY_SET = new Set<string>(CANONICAL_CATEGORIES);

export type Difficulty = 'easy' | 'medium' | 'hard';
export type WordStatus = 'core' | 'pack' | 'review' | 'reject';

export const VALID_DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
export const VALID_STATUSES = new Set<WordStatus>(['core', 'pack', 'review', 'reject']);

export const MAX_CARD_LENGTH = 28;

export interface CsvWord {
  id: string;
  text: string;
  difficulty: Difficulty;
  category: string;
  status: WordStatus;
  group: string;
}

export function parseWordsCsv(content: string): CsvWord[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('words-master.csv must contain a header and at least one word');
  }

  const header = lines[0]
    ?.split(',')
    .map((cell) => cell.trim())
    .join(',');
  if (header !== CSV_HEADER) {
    throw new Error(`words-master.csv header must be: ${CSV_HEADER}`);
  }

  const words: CsvWord[] = [];
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    const word = parseCsvRow(line, i + 1);
    if (seenIds.has(word.id)) {
      throw new Error(`Duplicate id: ${word.id} (${word.text})`);
    }
    const textKey = word.text.normalize('NFC').toLowerCase();
    if (seenTexts.has(textKey)) {
      throw new Error(`Duplicate text: ${word.text}`);
    }
    seenIds.add(word.id);
    seenTexts.add(textKey);
    words.push(word);
  }

  return words;
}

export function formatWordsCsv(words: CsvWord[]): string {
  const rows = words.map((word) =>
    [word.id, word.text, word.difficulty, word.category, word.status, word.group].join(','),
  );
  return [CSV_HEADER, ...rows].join('\n') + '\n';
}

function parseCsvRow(line: string, lineNumber: number): CsvWord {
  const parts = line.split(',');
  if (parts.length < 5) {
    throw new Error(`Invalid CSV row at line ${lineNumber}: ${line}`);
  }

  const id = (parts[0] ?? '').trim();
  const text = (parts[1] ?? '').trim();
  const difficulty = (parts[2] ?? '').trim() as Difficulty;
  const category = (parts[3] ?? '').trim();
  const status = (parts[4] ?? '').trim() as WordStatus;
  const group = (parts[5] ?? '').trim();

  if (!id) {
    throw new Error(`Empty id at line ${lineNumber}: ${line}`);
  }
  if (!text) {
    throw new Error(`Empty text at line ${lineNumber}: ${line}`);
  }
  if (!VALID_DIFFICULTIES.has(difficulty)) {
    throw new Error(`Invalid difficulty "${difficulty}" for word "${text}"`);
  }
  if (!category) {
    throw new Error(`Empty category for word "${text}"`);
  }
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status "${status}" for word "${text}"`);
  }

  return { id, text, difficulty, category, status, group };
}
