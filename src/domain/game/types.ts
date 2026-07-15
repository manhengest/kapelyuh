export type RoundType = 'elias' | 'crocodile' | 'association';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameStatus =
  | 'idle'
  | 'setup_settings'
  | 'setup_teams'
  | 'round_intro'
  | 'in_turn'
  | 'awaiting_award'
  | 'review'
  | 'round_results'
  | 'stat_carousel'
  | 'end_of_match';

export const SCORE = {
  guess: 1,
  award: 1,
  awardNone: 0,
} as const;

export const ROUND_TYPES: readonly RoundType[] = ['elias', 'crocodile', 'association'] as const;

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  teamCount: 2,
  turnDurationMs: 60_000,
  wordCount: 30,
  difficulties: ['easy'],
  enabledPackIds: ['bundled-default'],
  skipPenalty: 0,
};

export interface Word {
  id: string;
  text: string;
  difficulty: Difficulty;
  categoryId: string;
  packId: string;
}

export interface Pack {
  id: string;
  name: string;
  source: 'bundled' | 'custom';
  wordCount: number;
}

export interface Team {
  id: string;
  name: string;
  emoji?: string;
  scores: Record<RoundType, number>;
}

export interface MatchSettings {
  teamCount: number;
  turnDurationMs: number;
  wordCount: number;
  difficulties: Difficulty[];
  enabledPackIds: string[];
  skipPenalty: 0 | -1;
}

export type TurnEvent =
  | { kind: 'guessed'; wordId: string; at: number }
  | { kind: 'skipped'; wordId: string; at: number }
  | { kind: 'expired'; at: number; pendingWordId: string | null }
  | { kind: 'awarded'; wordId: string; toTeamId: string | null; at: number };

export interface TurnState {
  teamId: string;
  startedAt: number;
  endsAt: number;
  pausedAt: number | null;
  remainingOnPauseMs: number | null;
  currentWordId: string | null;
  events: TurnEvent[];
}

export interface RoundState {
  type: RoundType;
  sessionWordIds: string[];
  remainingWordIds: string[];
  guessedWordIds: string[];
  turnIndex: number;
}

export interface CompletedTurn {
  teamId: string;
  roundIndex: number;
  roundType: RoundType;
  events: TurnEvent[];
  startedAt: number;
  endedAt: number;
}

export interface GameState {
  status: GameStatus;
  settings: MatchSettings;
  teams: Team[];
  rounds: RoundState[];
  currentRoundIndex: 0 | 1 | 2;
  currentTeamIndex: number;
  turn: TurnState | null;
  turnHistory: CompletedTurn[];
  statCardsRemaining: number;
  createdAt: number;
  updatedAt: number;
  schemaVersion: 1;
}

export interface SessionHistoryEntry {
  id: string;
  finishedAt: number;
  teams: Pick<Team, 'name' | 'scores'>[];
  durationMs: number;
  settings: MatchSettings;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  sentryEnabled: boolean;
  hasSeenRules: boolean;
  skipPenaltyEnabled: boolean;
}

export interface MatchStats {
  fastestGuess: { wordText: string; durationMs: number } | null;
  slowestGuess: { wordText: string; durationMs: number } | null;
  leastSkippedTeam: { teamName: string; skipCount: number } | null;
  mostSkippedWord: { wordText: string; skipCount: number } | null;
  bestRound: { teamName: string; totalWordsGuessed: number } | null;
}
