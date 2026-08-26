import type { Word } from '@domain/game/types';

import { getDatabase } from './databaseRef';
import { BUNDLED_PACK_ID } from './schema';

type WordRow = {
  id: string;
  text: string;
  difficulty: Word['difficulty'];
  category_id: string;
  pack_id: string;
  group_id: string | null;
};

let wordsCache: Word[] | null = null;
let textMapCache: Record<string, string> | null = null;

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    text: row.text,
    difficulty: row.difficulty,
    categoryId: row.category_id,
    packId: row.pack_id,
    ...(row.group_id ? { groupId: row.group_id } : {}),
  };
}

function buildPlaceholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

export async function getAllWords(packIds: readonly string[]): Promise<Word[]> {
  if (!wordsCache) {
    const db = getDatabase();
    const rows = await db.getAllAsync<WordRow>(
      `SELECT id, text, difficulty, category_id, pack_id, group_id FROM words ORDER BY id`,
    );

    wordsCache = rows.map(rowToWord);
    textMapCache = Object.fromEntries(wordsCache.map((word) => [word.id, word.text]));
  }

  if (packIds.length === 0) {
    return [];
  }

  const packSet = new Set(packIds);
  return wordsCache.filter((word) => packSet.has(word.packId));
}

export async function getWordTextMap(): Promise<Record<string, string>> {
  if (textMapCache) {
    return textMapCache;
  }

  await getAllWords([BUNDLED_PACK_ID]);
  return textMapCache ?? {};
}

export function clearWordsCache(): void {
  wordsCache = null;
  textMapCache = null;
}

export async function getWordsByIds(wordIds: readonly string[]): Promise<Word[]> {
  if (wordIds.length === 0) {
    return [];
  }

  const db = getDatabase();
  const placeholders = buildPlaceholders(wordIds.length);
  const rows = await db.getAllAsync<WordRow>(
    `SELECT id, text, difficulty, category_id, pack_id, group_id FROM words WHERE id IN (${placeholders})`,
    ...wordIds,
  );
  return rows.map(rowToWord);
}
