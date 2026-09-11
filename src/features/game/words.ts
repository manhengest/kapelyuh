import type { MatchSettings, Word } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';
import { BUNDLED_PACK_ID } from '@infrastructure/db/schema';
import { getAllWords } from '@infrastructure/db/words.repo';
import { getSavedWords } from '@infrastructure/storage/savedWords';
import { getUsageMap } from '@infrastructure/storage/wordUsage';

function savedWordsAsWords(): Word[] {
  return Object.entries(getSavedWords()).map(([id, word]) => ({
    id,
    text: word.text,
    difficulty: word.difficulty,
    categoryId: 'custom',
    packId: BUNDLED_PACK_ID,
  }));
}

export async function selectSessionWordIds(settings: MatchSettings): Promise<string[]> {
  const bundled = await getAllWords(settings.enabledPackIds);
  const saved = settings.enabledPackIds.includes(BUNDLED_PACK_ID) ? savedWordsAsWords() : [];
  const usage = getUsageMap();
  return selectSessionWords({
    words: [...bundled, ...saved],
    difficulties: settings.difficulties,
    wordCount: settings.wordCount,
    usage,
    enabledPackIds: settings.enabledPackIds,
  });
}
