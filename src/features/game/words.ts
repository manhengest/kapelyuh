import type { MatchSettings } from '@domain/game/types';
import { selectSessionWords } from '@domain/game/wordSelector';
import { getAllWords } from '@infrastructure/db/words.repo';
import { getUsageMap } from '@infrastructure/storage/wordUsage';

export async function selectSessionWordIds(settings: MatchSettings): Promise<string[]> {
  const words = await getAllWords(settings.enabledPackIds);
  const usage = getUsageMap();
  return selectSessionWords({
    words,
    difficulties: settings.difficulties,
    wordCount: settings.wordCount,
    usage,
    enabledPackIds: settings.enabledPackIds,
  });
}
