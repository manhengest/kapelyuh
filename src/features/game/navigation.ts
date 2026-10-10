import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import type { GameStatus } from '@domain/game/types';

import { STATUS_ROUTE, useGameState } from './hooks';
import { useGameStore } from './store';

/** Screens that stay inside a status without replacing the status route. */
const STATUS_ROUTE_ALIASES: Partial<Record<GameStatus, readonly string[]>> = {
  end_of_match: ['/game/save-words'],
};

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
    const status = state.status as GameStatus;
    const target = STATUS_ROUTE[status];
    const staysOnStatus = STATUS_ROUTE_ALIASES[status]?.some((route) => route === pathname);
    if (!target || pathname === target || staysOnStatus) {
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
