export const WORD_ACTION_COLORS = {
  guessed: '#22C55E',
  skipped: '#EF4444',
} as const;

export const STACK_MAX_VISIBLE = 3;

export const STACK_LAYER_OFFSETS = [
  { translateY: 0, scale: 1, zIndex: 3 },
  { translateY: 8, scale: 0.97, zIndex: 2 },
  { translateY: 16, scale: 0.94, zIndex: 1 },
] as const;

export const EXIT_ANIMATION_DURATION_MS = 320;
export const EXIT_ANIMATION_DURATION_REDUCED_MS = 80;
export const EXIT_TRANSLATE_Y = -100;
export const EXIT_SCALE = 1.03;
export const STACK_ENTER_FROM = { translateY: 24, scale: 0.91 } as const;

export type WordCardAction = 'guess' | 'skip';

export function getVisibleStackDepth(hasCurrentWord: boolean, remainingCount: number): number {
  const total = (hasCurrentWord ? 1 : 0) + remainingCount;
  return Math.min(STACK_MAX_VISIBLE, Math.max(0, total));
}

export function getStackWordIds(
  currentWordId: string | null,
  remainingWordIds: string[],
): string[] {
  const ids: string[] = [];
  if (currentWordId) {
    ids.push(currentWordId);
  }
  for (const id of remainingWordIds) {
    if (ids.length >= STACK_MAX_VISIBLE) {
      break;
    }
    ids.push(id);
  }
  return ids;
}

export function getNextStackWordIds(
  action: WordCardAction,
  currentWordId: string | null,
  remainingWordIds: string[],
): string[] {
  if (!currentWordId) {
    return remainingWordIds.slice(0, STACK_MAX_VISIBLE);
  }

  if (action === 'guess') {
    return remainingWordIds.slice(0, STACK_MAX_VISIBLE);
  }

  return [...remainingWordIds, currentWordId].slice(0, STACK_MAX_VISIBLE);
}
