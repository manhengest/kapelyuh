import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import type { GameStatus } from '@domain/game/types';

import { STATUS_ROUTE, useGameState } from './hooks';
import { useGameStore } from './store';

export function useHydrateGameStore() {
  const hydrate = useGameStore((store) => store.hydrate);
  const hydrated = useGameStore((store) => store.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return hydrated;
}

export function useGameRouteSync() {
  const state = useGameState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = STATUS_ROUTE[state.status as GameStatus];
    if (!target || pathname === target) {
      return;
    }

    // Only auto-sync while the user is already inside the game flow.
    if (!pathname.startsWith('/game')) {
      return;
    }

    router.replace(target as never);
  }, [state.status, pathname, router]);
}

export function GameRouteSync() {
  useGameRouteSync();
  return null;
}
