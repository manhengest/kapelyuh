import type {
  CompletedTurn,
  GameState,
  MatchStats,
  RoundType,
  Team,
  TurnEvent,
} from './types';
import { CARRY_OVER_MIN_MS, ROUND_TYPES } from './types';

export function selectCurrentTeam(state: GameState): Team | null {
  return state.teams[state.currentTeamIndex] ?? null;
}

export function selectCurrentRound(state: GameState) {
  return state.rounds[state.currentRoundIndex] ?? null;
}

export function selectIsHatEmpty(state: GameState): boolean {
  const round = selectCurrentRound(state);
  if (!round) {
    return true;
  }

  const hasQueuedWords = round.remainingWordIds.length > 0;
  const hasActiveWord = state.turn?.currentWordId != null;
  return !hasQueuedWords && !hasActiveWord;
}

export function selectRemainingWordCount(state: GameState): number {
  const round = selectCurrentRound(state);
  if (!round) {
    return 0;
  }

  const activeWord = state.turn?.currentWordId ? 1 : 0;
  return round.remainingWordIds.length + activeWord;
}

export function selectRemainingWords(
  state: GameState,
  wordTexts: Record<string, string>,
): { id: string; text: string }[] {
  const round = selectCurrentRound(state);
  if (!round) {
    return [];
  }

  const ids = [...round.remainingWordIds];
  if (state.turn?.currentWordId) {
    ids.unshift(state.turn.currentWordId);
  }

  return ids.map((id) => ({
    id,
    text: wordTexts[id] ?? id,
  }));
}

export interface ScoreboardRow {
  teamId: string;
  name: string;
  scores: Record<RoundType, number>;
  total: number;
}

export function selectScoreboard(state: GameState): ScoreboardRow[] {
  return state.teams.map((team) => ({
    teamId: team.id,
    name: team.name,
    scores: { ...team.scores },
    total: ROUND_TYPES.reduce((sum, roundType) => sum + team.scores[roundType], 0),
  }));
}

export function selectWinners(state: GameState): Team[] {
  const board = selectScoreboard(state);
  if (board.length === 0) {
    return [];
  }

  const maxTotal = Math.max(...board.map((row) => row.total));
  const winnerIds = new Set(board.filter((row) => row.total === maxTotal).map((row) => row.teamId));
  return state.teams.filter((team) => winnerIds.has(team.id));
}

export function selectIsCarryOver(state: GameState): boolean {
  return state.carryOverMs != null && state.carryOverMs >= CARRY_OVER_MIN_MS;
}

export function selectUpcomingTurnDurationMs(state: GameState): number {
  return selectIsCarryOver(state) ? (state.carryOverMs as number) : state.settings.turnDurationMs;
}

export function selectReviewBanner(state: GameState): 'hat_empty' | 'time_up' | null {
  if (state.status !== 'review') {
    return null;
  }

  return selectIsHatEmpty(state) ? 'hat_empty' : 'time_up';
}

export function selectReviewCta(state: GameState): 'next_turn' | 'next_round' | 'match_results' | null {
  if (state.status !== 'review') {
    return null;
  }

  if (!selectIsHatEmpty(state)) {
    return 'next_turn';
  }

  if (state.currentRoundIndex < 2) {
    return 'next_round';
  }

  return 'match_results';
}

function guessDurations(turn: CompletedTurn): { wordId: string; durationMs: number }[] {
  const durations: { wordId: string; durationMs: number }[] = [];
  let previousAt = turn.startedAt;

  for (const event of turn.events) {
    if (event.kind === 'guessed') {
      durations.push({
        wordId: event.wordId,
        durationMs: Math.max(0, event.at - previousAt),
      });
    }
    if (event.kind === 'guessed' || event.kind === 'skipped') {
      previousAt = event.at;
    }
  }

  return durations;
}

const MIN_COMPARABLE_GUESS_MS = 1;

export function formatGuessDurationSeconds(durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(durationMs / 1000));
}

export function selectMatchStatCardCount(stats: MatchStats): number {
  let count = 0;
  if (stats.fastestGuess) {
    count += 1;
  }
  if (stats.mostSkippedWord) {
    count += 1;
  }
  if (stats.bestTurn) {
    count += 1;
  }
  return count > 0 ? count : 1;
}

export function selectMatchStats(
  turnHistory: CompletedTurn[],
  teams: Team[],
  wordTexts: Record<string, string>,
): MatchStats {
  const guessEvents: { wordId: string; durationMs: number }[] = [];
  const skipCountsByTeam = new Map<string, number>();
  const skipCountsByWord = new Map<string, number>();

  for (const turn of turnHistory) {
    guessDurations(turn).forEach((entry) => guessEvents.push(entry));

    for (const event of turn.events) {
      if (event.kind === 'skipped') {
        skipCountsByTeam.set(turn.teamId, (skipCountsByTeam.get(turn.teamId) ?? 0) + 1);
        skipCountsByWord.set(event.wordId, (skipCountsByWord.get(event.wordId) ?? 0) + 1);
      }
    }
  }

  const durationByWord = new Map<string, number>();
  for (const entry of guessEvents) {
    durationByWord.set(
      entry.wordId,
      (durationByWord.get(entry.wordId) ?? 0) + entry.durationMs,
    );
  }

  const wordDurations = [...durationByWord.entries()].map(([wordId, durationMs]) => ({
    wordId,
    durationMs,
  }));

  const comparableGuesses = wordDurations.filter(
    (entry) => entry.durationMs >= MIN_COMPARABLE_GUESS_MS,
  );
  const fastestPool = comparableGuesses.length > 0 ? comparableGuesses : wordDurations;

  const fastestGuess =
    fastestPool.length > 0
      ? fastestPool.reduce((best, current) =>
          current.durationMs < best.durationMs ? current : best,
        )
      : null;

  const slowestGuess =
    wordDurations.length > 0
      ? wordDurations.reduce((worst, current) =>
          current.durationMs > worst.durationMs ? current : worst,
        )
      : null;

  let leastSkippedTeam: MatchStats['leastSkippedTeam'] = null;
  if (teams.length > 0) {
    leastSkippedTeam = teams
      .map((team) => ({
        teamName: team.name,
        skipCount: skipCountsByTeam.get(team.id) ?? 0,
      }))
      .reduce((best, current) => (current.skipCount < best.skipCount ? current : best));
  }

  let mostSkippedWord: MatchStats['mostSkippedWord'] = null;
  if (skipCountsByWord.size > 0) {
    const [wordId, skipCount] = [...skipCountsByWord.entries()].reduce((best, current) =>
      current[1] > best[1] ? current : best,
    );
    mostSkippedWord = {
      wordText: wordTexts[wordId] ?? wordId,
      skipCount,
    };
  }

  let bestTurn: MatchStats['bestTurn'] = null;
  for (const turn of turnHistory) {
    const totalWordsGuessed = turn.events.filter((event) => event.kind === 'guessed').length;
    if (totalWordsGuessed === 0) {
      continue;
    }
    if (!bestTurn || totalWordsGuessed > bestTurn.totalWordsGuessed) {
      bestTurn = {
        teamName: teams.find((team) => team.id === turn.teamId)?.name ?? turn.teamId,
        totalWordsGuessed,
      };
    }
  }

  return {
    fastestGuess: fastestGuess
      ? {
          wordText: wordTexts[fastestGuess.wordId] ?? fastestGuess.wordId,
          durationMs: fastestGuess.durationMs,
        }
      : null,
    slowestGuess: slowestGuess
      ? {
          wordText: wordTexts[slowestGuess.wordId] ?? slowestGuess.wordId,
          durationMs: slowestGuess.durationMs,
        }
      : null,
    leastSkippedTeam,
    mostSkippedWord,
    bestTurn,
  };
}

export function collectTurnEventsFromHistory(turnHistory: CompletedTurn[]): TurnEvent[] {
  return turnHistory.flatMap((turn) => turn.events);
}
