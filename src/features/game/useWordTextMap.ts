import { useEffect, useState } from 'react';

import { getWordTextMap } from '@infrastructure/db/words.repo';

const EMPTY_MAP: Record<string, string> = {};

export function useWordTextMap(): {
  wordTexts: Record<string, string>;
  isLoading: boolean;
} {
  const [wordTexts, setWordTexts] = useState(EMPTY_MAP);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const map = await getWordTextMap();
        if (!cancelled) {
          setWordTexts(map);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { wordTexts, isLoading };
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
