import { useEffect, useMemo, useState } from 'react';

import { getWordTextMap } from '@infrastructure/db/words.repo';
import { getCustomWords } from '@infrastructure/storage/customWords';
import { getSavedWordTexts } from '@infrastructure/storage/savedWords';

const EMPTY_MAP: Record<string, string> = {};

type BundledWordMapState =
  | { status: 'loading' }
  | { status: 'ready'; map: Record<string, string> }
  | { status: 'error' };

function useBundledWordMap(): BundledWordMapState {
  const [state, setState] = useState<BundledWordMapState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const map = await getWordTextMap();
        if (!cancelled) {
          setState({ status: 'ready', map });
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useWordTextMap(): {
  wordTexts: Record<string, string>;
  isLoading: boolean;
} {
  const bundled = useBundledWordMap();
  const wordTexts = useMemo(() => {
    if (bundled.status !== 'ready') {
      return EMPTY_MAP;
    }
    return { ...bundled.map, ...getCustomWords(), ...getSavedWordTexts() };
  }, [bundled]);

  return { wordTexts, isLoading: bundled.status === 'loading' };
}

/** `null` until the bundled map loads. A failed load stays `null` so callers do not treat it as an empty set. */
export function useBundledWordTexts(): readonly string[] | null {
  const bundled = useBundledWordMap();

  return useMemo(() => {
    if (bundled.status !== 'ready') {
      return null;
    }
    return Object.values(bundled.map);
  }, [bundled]);
}

export function useWordText(
  wordId: string | null | undefined,
  wordTexts: Record<string, string>,
): string {
  if (!wordId) {
    return '';
  }
  return wordTexts[wordId] ?? wordId;
}
