import { create } from 'zustand';

import { createInitialState } from '@domain/game/reducer';
import type { GameState } from '@domain/game/types';

type GameStore = {
  state: GameState;
  reset: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  state: createInitialState(),
  reset: () => set({ state: createInitialState() }),
}));
