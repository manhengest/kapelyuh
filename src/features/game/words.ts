import type { MatchSettings } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';
import { getRecentSessionWordIds } from '@infrastructure/db/sessions.repo';
import { getAllWords } from '@infrastructure/db/words.repo';

export async function selectSessionWordIds(settings: MatchSettings): Promise<string[]> {
  const words = await getAllWords(settings.enabledPackIds);
  const excludedWordIds = await getRecentSessionWordIds(3);
  return selectSessionWords({
    words,
    difficulties: settings.difficulties,
    wordCount: settings.wordCount,
    excludedWordIds,
    enabledPackIds: settings.enabledPackIds,
  });
}
