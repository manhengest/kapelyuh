import type { MatchSettings, Team } from './types';

export type GameEvent =
  | { type: 'START_SETUP'; now: number }
  | { type: 'SETTINGS_COMPLETED'; settings: MatchSettings; now: number }
  | { type: 'BACK_TO_SETTINGS'; now: number }
  | { type: 'TEAMS_COMPLETED'; teams: Team[]; sessionWordIds: string[]; now: number }
  | { type: 'ROUND_INTRO_ACK'; now: number }
  | { type: 'GUESS_WORD'; now: number }
  | { type: 'SKIP_WORD'; now: number }
  | { type: 'TIMER_EXPIRED'; now: number }
  | { type: 'AWARD_WORD'; toTeamId: string | null; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'REVIEW_SUBMITTED'; overrides: Record<string, 'guessed' | 'skipped'>; now: number }
  | { type: 'NEXT_TURN'; now: number }
  | { type: 'NEXT_ROUND'; now: number }
  | { type: 'OPEN_STAT_CAROUSEL'; now: number }
  | { type: 'DISMISS_STAT_CAROUSEL'; now: number }
  | { type: 'REPLAY_WITH_SAME_TEAMS'; now: number }
  | { type: 'ABANDON_MATCH'; now: number };
