import type { GameState } from '@domain/game/types';
import { getCustomWords } from '@infrastructure/storage/customWords';

export function customHatWordTexts(state: Pick<GameState, 'settings' | 'rounds'>): string[] {
  if (state.settings.wordSource !== 'custom') {
    return [];
  }

  const custom = getCustomWords();
  return (state.rounds[0]?.sessionWordIds ?? [])
    .map((id) => custom[id])
    .filter((text): text is string => Boolean(text));
}
