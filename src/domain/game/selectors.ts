import type { CompletedTurn, GameState, RecapCard, RoundType, Team, TurnEvent } from './types';
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

export function selectReviewCta(
  state: GameState,
): 'next_turn' | 'next_round' | 'match_results' | null {
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

const FASTEST_MAX_MS = 8_000;
const SLOWEST_MIN_MS = 25_000;
const HARDEST_MIN_SKIPS = 2;
const BEST_TURN_MIN_GUESSES = 5;
const CLOSE_GAP_MAX = 2;
const BLOWOUT_GAP_MIN = 10;

const MIDDLE_TIE_ORDER: Record<'hardest' | 'fastest' | 'slowest' | 'best_turn', number> = {
  hardest: 0,
  fastest: 1,
  slowest: 2,
  best_turn: 3,
};

export function formatGuessDurationSeconds(durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(durationMs / 1000));
}

export function selectMatchDurationMs(
  turnHistory: CompletedTurn[],
  createdAt: number,
): number | null {
  const lastTurn = turnHistory.at(-1);
  if (!lastTurn) {
    return null;
  }

  return Math.max(0, lastTurn.endedAt - createdAt);
}

function teamTotal(team: Team): number {
  return ROUND_TYPES.reduce((sum, roundType) => sum + team.scores[roundType], 0);
}

function selectScoreGap(teams: Team[]): number | null {
  if (teams.length < 2) {
    return null;
  }

  const totals = teams.map(teamTotal).sort((left, right) => right - left);
  return totals[0]! - totals[1]!;
}

function wordText(wordId: string, wordTexts: Record<string, string>): string {
  return wordTexts[wordId] ?? wordId;
}

function summedGuessDurations(turnHistory: CompletedTurn[]): Map<string, number> {
  const durationByWord = new Map<string, number>();

  for (const turn of turnHistory) {
    for (const entry of guessDurations(turn)) {
      durationByWord.set(entry.wordId, (durationByWord.get(entry.wordId) ?? 0) + entry.durationMs);
    }
  }

  return durationByWord;
}

function selectHardestWord(
  turnHistory: CompletedTurn[],
  wordTexts: Record<string, string>,
): Extract<RecapCard, { kind: 'hardest' }> | null {
  const progress = new Map<
    string,
    { skipsBeforeFirst: number; attemptIndex: number; resolved: boolean }
  >();

  const ensure = (wordId: string) => {
    let entry = progress.get(wordId);
    if (!entry) {
      entry = { skipsBeforeFirst: 0, attemptIndex: 0, resolved: false };
      progress.set(wordId, entry);
    }
    return entry;
  };

  for (const turn of turnHistory) {
    for (const event of turn.events) {
      if (event.kind === 'skipped') {
        const entry = ensure(event.wordId);
        if (!entry.resolved) {
          entry.skipsBeforeFirst += 1;
        }
        continue;
      }

      const resolvedByGuess = event.kind === 'guessed';
      const resolvedByAward = event.kind === 'awarded' && event.toTeamId != null;
      if (!resolvedByGuess && !resolvedByAward) {
        continue;
      }

      const entry = ensure(event.wordId);
      if (entry.resolved) {
        continue;
      }

      entry.resolved = true;
      entry.attemptIndex = entry.skipsBeforeFirst + 1;
    }
  }

  let hardest: { wordId: string; skipsBeforeFirst: number; attemptIndex: number } | null = null;
  for (const [wordId, entry] of progress) {
    if (!entry.resolved || entry.skipsBeforeFirst < HARDEST_MIN_SKIPS) {
      continue;
    }
    if (!hardest || entry.skipsBeforeFirst > hardest.skipsBeforeFirst) {
      hardest = {
        wordId,
        skipsBeforeFirst: entry.skipsBeforeFirst,
        attemptIndex: entry.attemptIndex,
      };
    }
  }

  if (!hardest) {
    return null;
  }

  return {
    kind: 'hardest',
    wordText: wordText(hardest.wordId, wordTexts),
    skipsBeforeFirst: hardest.skipsBeforeFirst,
    attemptIndex: hardest.attemptIndex,
  };
}

function selectBestTurn(
  turnHistory: CompletedTurn[],
  teams: Team[],
): Extract<RecapCard, { kind: 'best_turn' }> | null {
  let best: { teamId: string; totalWordsGuessed: number } | null = null;

  for (const turn of turnHistory) {
    const totalWordsGuessed = turn.events.filter((event) => event.kind === 'guessed').length;
    if (totalWordsGuessed < BEST_TURN_MIN_GUESSES) {
      continue;
    }
    if (!best || totalWordsGuessed > best.totalWordsGuessed) {
      best = { teamId: turn.teamId, totalWordsGuessed };
    }
  }

  if (!best) {
    return null;
  }

  return {
    kind: 'best_turn',
    teamName: teams.find((team) => team.id === best.teamId)?.name ?? best.teamId,
    totalWordsGuessed: best.totalWordsGuessed,
  };
}

function summaryCounts(turnHistory: CompletedTurn[]): {
  guessedCount: number;
  skippedCount: number;
} {
  let guessedCount = 0;
  let skippedCount = 0;

  for (const turn of turnHistory) {
    for (const event of turn.events) {
      if (event.kind === 'guessed' || (event.kind === 'awarded' && event.toTeamId != null)) {
        guessedCount += 1;
      }
      if (event.kind === 'skipped') {
        skippedCount += 1;
      }
    }
  }

  return { guessedCount, skippedCount };
}

export function selectRecapCards(
  turnHistory: CompletedTurn[],
  teams: Team[],
  wordTexts: Record<string, string>,
  createdAt: number,
): RecapCard[] {
  const cards: RecapCard[] = [];
  const gap = selectScoreGap(teams);

  if (gap != null && gap >= 1 && gap <= CLOSE_GAP_MAX) {
    cards.push({ kind: 'close_game', gap });
  } else if (gap != null && gap >= BLOWOUT_GAP_MIN) {
    cards.push({ kind: 'blowout', gap });
  }

  const durationByWord = summedGuessDurations(turnHistory);
  const wordDurations = [...durationByWord.entries()].map(([wordId, durationMs]) => ({
    wordId,
    durationMs,
  }));

  type MiddleKind = 'hardest' | 'fastest' | 'slowest' | 'best_turn';
  const middle: { card: RecapCard; score: number; kind: MiddleKind }[] = [];

  const fastest =
    wordDurations.length > 0
      ? wordDurations.reduce((best, current) =>
          current.durationMs < best.durationMs ? current : best,
        )
      : null;
  if (fastest && fastest.durationMs < FASTEST_MAX_MS) {
    middle.push({
      kind: 'fastest',
      score: (FASTEST_MAX_MS - fastest.durationMs) / 1000,
      card: {
        kind: 'fastest',
        wordText: wordText(fastest.wordId, wordTexts),
        durationMs: fastest.durationMs,
      },
    });
  }

  const slowest =
    wordDurations.length > 0
      ? wordDurations.reduce((worst, current) =>
          current.durationMs > worst.durationMs ? current : worst,
        )
      : null;
  if (slowest && slowest.durationMs >= SLOWEST_MIN_MS) {
    middle.push({
      kind: 'slowest',
      score: (slowest.durationMs - SLOWEST_MIN_MS) / 5000,
      card: {
        kind: 'slowest',
        wordText: wordText(slowest.wordId, wordTexts),
        durationMs: slowest.durationMs,
      },
    });
  }

  const hardest = selectHardestWord(turnHistory, wordTexts);
  if (hardest) {
    middle.push({
      kind: 'hardest',
      score: hardest.skipsBeforeFirst - HARDEST_MIN_SKIPS,
      card: hardest,
    });
  }

  const bestTurn = selectBestTurn(turnHistory, teams);
  if (bestTurn) {
    middle.push({
      kind: 'best_turn',
      score: bestTurn.totalWordsGuessed - BEST_TURN_MIN_GUESSES,
      card: bestTurn,
    });
  }

  middle.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return MIDDLE_TIE_ORDER[left.kind] - MIDDLE_TIE_ORDER[right.kind];
  });

  for (const entry of middle) {
    cards.push(entry.card);
  }

  const { guessedCount, skippedCount } = summaryCounts(turnHistory);
  cards.push({
    kind: 'summary',
    durationMs: selectMatchDurationMs(turnHistory, createdAt),
    guessedCount,
    skippedCount,
    turnCount: turnHistory.length,
  });

  return cards;
}

export function collectTurnEventsFromHistory(turnHistory: CompletedTurn[]): TurnEvent[] {
  return turnHistory.flatMap((turn) => turn.events);
}
