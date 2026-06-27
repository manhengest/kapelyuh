import type { GameState } from '@domain/game/types';

import { clearJson, getJson, setJson } from './mmkv';

const ACTIVE_MATCH_KEY = 'kapelyukh.activeMatch';

export function getActiveMatch(): GameState | null {
  return getJson<GameState>(ACTIVE_MATCH_KEY);
}

export function setActiveMatch(state: GameState): void {
  setJson(ACTIVE_MATCH_KEY, state);
}

export function clearActiveMatch(): void {
  clearJson(ACTIVE_MATCH_KEY);
}
