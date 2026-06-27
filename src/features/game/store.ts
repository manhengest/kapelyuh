import { create } from 'zustand';

import type { GameEvent } from '@domain/game/events';
import { createInitialState, gameReducer, isActiveMatch } from '@domain/game/reducer';
import type { GameState } from '@domain/game/types';
import { saveFinishedSession } from '@infrastructure/db/sessions.repo';
import {
  clearActiveMatch,
  getActiveMatch,
  setActiveMatch,
} from '@infrastructure/storage/activeMatch';

type DispatchEvent = {
  [K in GameEvent as K['type']]: Omit<K, 'now'> & { now?: number };
}[GameEvent['type']];

type GameStore = {
  state: GameState;
  hydrated: boolean;
  pauseModalVisible: boolean;
  hydrate: () => void;
  dispatch: (event: DispatchEvent) => GameState;
  setPauseModalVisible: (visible: boolean) => void;
  abandonMatch: () => void;
};

function persistMatch(state: GameState): void {
  if (isActiveMatch(state)) {
    setActiveMatch(state);
    return;
  }

  if (state.status === 'idle' || state.status === 'end_of_match') {
    clearActiveMatch();
  }
}

function handleMatchEnd(prev: GameState, next: GameState): void {
  if (next.status === 'end_of_match' && prev.status !== 'end_of_match') {
    void saveFinishedSession(next).catch((error: unknown) => {
      console.error('Failed to save finished session', error);
    });
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  hydrated: false,
  pauseModalVisible: false,

  hydrate: () => {
    const saved = getActiveMatch();
    set({
      state: saved ?? createInitialState(),
      hydrated: true,
    });
  },

  dispatch: (event: DispatchEvent) => {
    const prev = get().state;
    const now = event.now ?? Date.now();
    const next = gameReducer(prev, { ...event, now } as GameEvent);
    handleMatchEnd(prev, next);
    set({ state: next });
    persistMatch(next);
    return next;
  },

  setPauseModalVisible: (visible) => set({ pauseModalVisible: visible }),

  abandonMatch: () => {
    const next = gameReducer(get().state, { type: 'ABANDON_MATCH', now: Date.now() });
    set({ state: next, pauseModalVisible: false });
    clearActiveMatch();
  },
}));

export function hasResumableMatch(state: GameState): boolean {
  return isActiveMatch(state);
}
