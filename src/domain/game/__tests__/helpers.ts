import { gameReducer, createInitialState } from '@domain/game/reducer';
import type { GameState, MatchSettings, Team } from '@domain/game/types';

export const BASE_TIME = 1_700_000_000_000;

export function makeTeam(id: string, name: string): Team {
  return {
    id,
    name,
    scores: { elias: 0, crocodile: 0, association: 0 },
  };
}

export function makeSettings(overrides: Partial<MatchSettings> = {}): MatchSettings {
  return {
    teamCount: 2,
    turnDurationMs: 60_000,
    wordCount: 3,
    difficulties: ['easy'],
    enabledPackIds: ['bundled-default'],
    skipPenalty: 0,
    ...overrides,
  };
}

export function startMatch(
  sessionWordIds: string[],
  teams: Team[] = [makeTeam('t1', 'Команда 1'), makeTeam('t2', 'Команда 2')],
  settings = makeSettings({ wordCount: sessionWordIds.length }),
  now = BASE_TIME,
): GameState {
  let state = createInitialState(now);
  state = gameReducer(state, { type: 'START_SETUP', now });
  state = gameReducer(state, { type: 'SETTINGS_COMPLETED', settings, now });
  state = gameReducer(state, {
    type: 'TEAMS_COMPLETED',
    teams,
    sessionWordIds,
    now,
  });
  state = gameReducer(state, { type: 'ROUND_INTRO_ACK', now });
  return state;
}

export function guessCurrentWord(state: GameState, now = BASE_TIME): GameState {
  return gameReducer(state, { type: 'GUESS_WORD', now });
}

export function skipCurrentWord(state: GameState, now = BASE_TIME): GameState {
  return gameReducer(state, { type: 'SKIP_WORD', now });
}

export function expireTimer(state: GameState, now = BASE_TIME + 60_000): GameState {
  return gameReducer(state, { type: 'TIMER_EXPIRED', now });
}

export function awardWord(
  state: GameState,
  toTeamId: string | null,
  now = BASE_TIME + 60_000,
): GameState {
  return gameReducer(state, { type: 'AWARD_WORD', toTeamId, now });
}

export function submitReview(
  state: GameState,
  overrides: Record<string, 'guessed' | 'skipped'> = {},
  now = BASE_TIME + 60_000,
): GameState {
  return gameReducer(state, { type: 'REVIEW_SUBMITTED', overrides, now });
}

export function nextTurn(state: GameState, now = BASE_TIME + 60_000): GameState {
  return gameReducer(state, { type: 'NEXT_TURN', now });
}

export function nextRound(state: GameState, now = BASE_TIME + 120_000): GameState {
  return gameReducer(state, { type: 'NEXT_ROUND', now });
}

export function getTeamScore(state: GameState, teamId: string): number {
  const team = state.teams.find((entry) => entry.id === teamId);
  if (!team) {
    return 0;
  }
  return team.scores.elias + team.scores.crocodile + team.scores.association;
}

export function getCurrentRoundScore(state: GameState, teamId: string): number {
  const team = state.teams.find((entry) => entry.id === teamId);
  const round = state.rounds[state.currentRoundIndex];
  if (!team || !round) {
    return 0;
  }
  return team.scores[round.type];
}
