import { shuffle } from '@domain/utils/shuffle';

import type { GameEvent } from './events';
import { applyReviewOverrides, clampScore, computeTurnScore } from './scoring';
import type {
  CompletedTurn,
  GameState,
  MatchSettings,
  RoundState,
  RoundType,
  Team,
  TurnState,
} from './types';
import { CARRY_OVER_MIN_MS, DEFAULT_MATCH_SETTINGS, ROUND_TYPES, SCORE } from './types';

const STAT_CARD_COUNT = 3;

export function createInitialState(now = 0): GameState {
  return {
    status: 'idle',
    settings: { ...DEFAULT_MATCH_SETTINGS },
    teams: [],
    rounds: [],
    currentRoundIndex: 0,
    currentTeamIndex: 0,
    turn: null,
    turnHistory: [],
    carryOverMs: null,
    statCardsRemaining: STAT_CARD_COUNT,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

function touch(state: GameState, now: number): GameState {
  return { ...state, updatedAt: now };
}

function createRound(type: RoundType, sessionWordIds: string[]): RoundState {
  return {
    type,
    sessionWordIds: [...sessionWordIds],
    remainingWordIds: shuffle([...sessionWordIds]),
    guessedWordIds: [],
    turnIndex: 0,
  };
}

function initTeams(teams: Team[]): Team[] {
  return teams.map((team) => ({
    ...team,
    scores: {
      elias: 0,
      crocodile: 0,
      association: 0,
    },
  }));
}

function resetTeamScores(teams: Team[]): Team[] {
  return teams.map((team) => ({
    ...team,
    scores: {
      elias: 0,
      crocodile: 0,
      association: 0,
    },
  }));
}

function getCurrentRound(state: GameState): RoundState {
  const round = state.rounds[state.currentRoundIndex];
  if (!round) {
    throw new Error(`Missing round at index ${state.currentRoundIndex}`);
  }
  return round;
}

function updateRound(state: GameState, patch: Partial<RoundState>): GameState {
  const rounds = [...state.rounds];
  rounds[state.currentRoundIndex] = {
    ...getCurrentRound(state),
    ...patch,
  };
  return { ...state, rounds };
}

function popNextWord(queue: string[]): { wordId: string | null; queue: string[] } {
  if (queue.length === 0) {
    return { wordId: null, queue: [] };
  }

  const [wordId, ...rest] = queue;
  return { wordId, queue: rest };
}

function addTeamRoundScore(
  teams: Team[],
  teamId: string,
  roundType: RoundType,
  delta: number,
): Team[] {
  return teams.map((team) => {
    if (team.id !== teamId) {
      return team;
    }

    const nextScore = clampScore(team.scores[roundType] + delta);
    return {
      ...team,
      scores: {
        ...team.scores,
        [roundType]: nextScore,
      },
    };
  });
}

function appendTurnHistory(state: GameState, endedAt: number): GameState {
  if (!state.turn) {
    return state;
  }

  const round = getCurrentRound(state);
  const completed: CompletedTurn = {
    teamId: state.turn.teamId,
    roundIndex: state.currentRoundIndex,
    roundType: round.type,
    events: [...state.turn.events],
    startedAt: state.turn.startedAt,
    endedAt,
  };

  return {
    ...state,
    turnHistory: [...state.turnHistory, completed],
  };
}

function finalizeTurnToReview(
  state: GameState,
  turn: TurnState,
  now: number,
  carryOverMs: number | null = null,
): GameState {
  return touch(
    {
      ...state,
      status: 'review',
      turn: {
        ...turn,
        currentWordId: null,
      },
      carryOverMs,
    },
    now,
  );
}

function applyLiveTurnScore(state: GameState, turn: TurnState): GameState {
  const round = getCurrentRound(state);
  const liveScore = computeTurnScore(turn.events, state.settings.skipPenalty);

  const baselineEvents = turn.events.slice(0, -1);
  const baselineScore = computeTurnScore(baselineEvents, state.settings.skipPenalty);
  const delta = liveScore - baselineScore;

  if (delta === 0) {
    return state;
  }

  return {
    ...state,
    teams: addTeamRoundScore(state.teams, turn.teamId, round.type, delta),
  };
}

function startTurnState(state: GameState, now: number): GameState {
  const round = getCurrentRound(state);
  const { wordId, queue } = popNextWord(round.remainingWordIds);

  if (!wordId) {
    throw new Error('Cannot start turn with an empty hat');
  }

  const team = state.teams[state.currentTeamIndex];
  if (!team) {
    throw new Error('Cannot start turn without an active team');
  }

  const duration =
    state.carryOverMs != null && state.carryOverMs >= CARRY_OVER_MIN_MS
      ? state.carryOverMs
      : state.settings.turnDurationMs;

  return touch(
    {
      ...updateRound(state, { remainingWordIds: queue }),
      status: 'in_turn',
      turn: {
        teamId: team.id,
        startedAt: now,
        endsAt: now + duration,
        durationMs: duration,
        pausedAt: null,
        remainingOnPauseMs: null,
        currentWordId: wordId,
        events: [],
      },
      carryOverMs: null,
    },
    now,
  );
}

function handleGuess(state: GameState, now: number): GameState {
  const turn = state.turn;
  if (!turn?.currentWordId) {
    return state;
  }

  const round = getCurrentRound(state);
  const wordId = turn.currentWordId;
  const nextTurn: TurnState = {
    ...turn,
    events: [...turn.events, { kind: 'guessed', wordId, at: now }],
  };

  const guessedWordIds = round.guessedWordIds.includes(wordId)
    ? round.guessedWordIds
    : [...round.guessedWordIds, wordId];

  const { wordId: nextWordId, queue } = popNextWord(round.remainingWordIds);
  let nextState = touch(
    updateRound(
      {
        ...state,
        turn: {
          ...nextTurn,
          currentWordId: nextWordId,
        },
      },
      {
        remainingWordIds: queue,
        guessedWordIds,
      },
    ),
    now,
  );

  nextState = applyLiveTurnScore(nextState, nextTurn);

  if (nextWordId === null && queue.length === 0) {
    const leftover = Math.max(0, turn.endsAt - now);
    const carryOverMs =
      nextState.currentRoundIndex < 2 && leftover >= CARRY_OVER_MIN_MS ? leftover : null;
    return finalizeTurnToReview(nextState, nextState.turn!, now, carryOverMs);
  }

  return nextState;
}

function handleSkip(state: GameState, now: number): GameState {
  const turn = state.turn;
  if (!turn?.currentWordId) {
    return state;
  }

  const round = getCurrentRound(state);
  const wordId = turn.currentWordId;
  const recycledQueue = [...round.remainingWordIds, wordId];
  const { wordId: nextWordId, queue } = popNextWord(recycledQueue);

  const nextTurn: TurnState = {
    ...turn,
    events: [...turn.events, { kind: 'skipped', wordId, at: now }],
    currentWordId: nextWordId,
  };

  let nextState = touch(
    updateRound(
      {
        ...state,
        turn: nextTurn,
      },
      { remainingWordIds: queue },
    ),
    now,
  );

  nextState = applyLiveTurnScore(nextState, nextTurn);
  return nextState;
}

function handleAward(state: GameState, toTeamId: string | null, now: number): GameState {
  const turn = state.turn;
  const wordId = turn?.currentWordId;
  if (!turn || !wordId) {
    return state;
  }

  const round = getCurrentRound(state);

  const nextTurn: TurnState = {
    ...turn,
    events: [
      ...turn.events,
      {
        kind: 'awarded',
        wordId,
        toTeamId,
        at: now,
      },
    ],
    currentWordId: null,
  };

  // «Ніхто не вгадав» — return the word to the hat; do not treat it as guessed.
  let nextState: GameState;
  if (toTeamId == null) {
    nextState = updateRound(state, {
      remainingWordIds: [...round.remainingWordIds, wordId],
    });
  } else {
    const guessedWordIds = round.guessedWordIds.includes(wordId)
      ? round.guessedWordIds
      : [...round.guessedWordIds, wordId];
    nextState = {
      ...updateRound(state, { guessedWordIds }),
      teams: addTeamRoundScore(state.teams, toTeamId, round.type, SCORE.award),
    };
  }

  return finalizeTurnToReview(touch({ ...nextState, turn: nextTurn }, now), nextTurn, now);
}

function handleReviewSubmitted(
  state: GameState,
  overrides: Record<string, 'guessed' | 'skipped'>,
  now: number,
): GameState {
  const turn = state.turn;
  if (!turn) {
    return state;
  }

  const round = getCurrentRound(state);
  const delta = applyReviewOverrides(turn.events, overrides, state.settings.skipPenalty);
  if (delta === 0) {
    return touch(state, now);
  }

  return touch(
    {
      ...state,
      teams: addTeamRoundScore(state.teams, turn.teamId, round.type, delta),
    },
    now,
  );
}

function assertStatus(state: GameState, allowed: GameState['status'][]): void {
  if (!allowed.includes(state.status)) {
    throw new Error(`Invalid transition from status "${state.status}"`);
  }
}

export function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START_SETUP':
      if (state.status !== 'idle') {
        return state;
      }
      return touch({ ...state, status: 'setup_settings' }, event.now);

    case 'SETTINGS_COMPLETED':
      return touch(
        {
          ...state,
          status: 'setup_teams',
          settings: event.settings,
        },
        event.now,
      );

    case 'BACK_TO_SETTINGS':
      if (state.status !== 'setup_teams') {
        return state;
      }
      return touch({ ...state, status: 'setup_settings' }, event.now);

    case 'BACK_TO_TEAMS':
      if (state.status !== 'round_intro') {
        return state;
      }
      return touch({ ...state, status: 'setup_teams' }, event.now);

    case 'TEAMS_COMPLETED': {
      assertStatus(state, ['setup_teams']);
      const teams = initTeams(event.teams);
      const firstRound = createRound(ROUND_TYPES[0], event.sessionWordIds);

      return touch(
        {
          ...state,
          status: 'round_intro',
          teams,
          rounds: [firstRound],
          currentRoundIndex: 0,
          currentTeamIndex: 0,
          turn: null,
          turnHistory: [],
          statCardsRemaining: STAT_CARD_COUNT,
          createdAt: event.now,
        },
        event.now,
      );
    }

    case 'ROUND_INTRO_ACK':
      assertStatus(state, ['round_intro']);
      return startTurnState(state, event.now);

    case 'GUESS_WORD':
      assertStatus(state, ['in_turn']);
      return handleGuess(state, event.now);

    case 'SKIP_WORD':
      assertStatus(state, ['in_turn']);
      return handleSkip(state, event.now);

    case 'TIMER_EXPIRED':
      assertStatus(state, ['in_turn']);
      if (!state.turn) {
        return state;
      }
      return touch(
        {
          ...state,
          status: 'awaiting_award',
          turn: {
            ...state.turn,
            events: [
              ...state.turn.events,
              {
                kind: 'expired',
                at: event.now,
                pendingWordId: state.turn.currentWordId,
              },
            ],
          },
        },
        event.now,
      );

    case 'AWARD_WORD':
      assertStatus(state, ['awaiting_award']);
      return handleAward(state, event.toTeamId, event.now);

    case 'PAUSE': {
      assertStatus(state, ['in_turn', 'awaiting_award']);
      if (!state.turn || state.turn.pausedAt != null) {
        return state;
      }

      const remainingOnPauseMs = Math.max(0, state.turn.endsAt - event.now);
      return touch(
        {
          ...state,
          turn: {
            ...state.turn,
            pausedAt: event.now,
            remainingOnPauseMs,
          },
        },
        event.now,
      );
    }

    case 'RESUME': {
      assertStatus(state, ['in_turn', 'awaiting_award']);
      if (!state.turn || state.turn.pausedAt == null) {
        return state;
      }

      const remaining = state.turn.remainingOnPauseMs ?? 0;
      return touch(
        {
          ...state,
          turn: {
            ...state.turn,
            pausedAt: null,
            remainingOnPauseMs: null,
            endsAt: event.now + remaining,
          },
        },
        event.now,
      );
    }

    case 'REVIEW_SUBMITTED':
      assertStatus(state, ['review']);
      return handleReviewSubmitted(state, event.overrides, event.now);

    case 'NEXT_TURN': {
      assertStatus(state, ['review']);
      const round = getCurrentRound(state);
      const withHistory = appendTurnHistory(state, event.now);
      return touch(
        {
          ...withHistory,
          status: 'round_intro',
          currentTeamIndex: (withHistory.currentTeamIndex + 1) % withHistory.teams.length,
          turn: null,
          carryOverMs: null,
          rounds: withHistory.rounds.map((entry, index) =>
            index === withHistory.currentRoundIndex
              ? { ...entry, turnIndex: round.turnIndex + 1 }
              : entry,
          ),
        },
        event.now,
      );
    }

    case 'NEXT_ROUND': {
      assertStatus(state, ['review']);
      const withHistory = appendTurnHistory(state, event.now);
      const nextRoundIndex = (withHistory.currentRoundIndex + 1) as 0 | 1 | 2;
      const nextRoundType = ROUND_TYPES[nextRoundIndex];
      const sessionWordIds = withHistory.rounds[0]?.sessionWordIds ?? [];
      const nextRound = createRound(nextRoundType, sessionWordIds);
      const hasCarryOver =
        withHistory.carryOverMs != null && withHistory.carryOverMs >= CARRY_OVER_MIN_MS;

      return touch(
        {
          ...withHistory,
          status: 'round_intro',
          currentRoundIndex: nextRoundIndex,
          currentTeamIndex: hasCarryOver ? withHistory.currentTeamIndex : 0,
          rounds: [...withHistory.rounds, nextRound],
          turn: null,
        },
        event.now,
      );
    }

    case 'OPEN_STAT_CAROUSEL': {
      assertStatus(state, ['review']);
      const withHistory = appendTurnHistory(state, event.now);
      return touch(
        {
          ...withHistory,
          status: 'stat_carousel',
          turn: null,
          statCardsRemaining: STAT_CARD_COUNT,
        },
        event.now,
      );
    }

    case 'DISMISS_STAT_CAROUSEL': {
      assertStatus(state, ['stat_carousel']);
      const remaining = state.statCardsRemaining - 1;
      if (remaining > 0) {
        return touch({ ...state, statCardsRemaining: remaining }, event.now);
      }

      return touch({ ...state, status: 'end_of_match', statCardsRemaining: 0 }, event.now);
    }

    case 'REPLAY_WITH_SAME_TEAMS':
      assertStatus(state, ['end_of_match']);
      return touch(
        {
          ...createInitialState(event.now),
          status: 'setup_teams',
          settings: state.settings,
          teams: resetTeamScores(state.teams),
        },
        event.now,
      );

    case 'ABANDON_MATCH':
      return touch(createInitialState(event.now), event.now);

    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

export function applySettings(state: GameState, settings: MatchSettings, now: number): GameState {
  return gameReducer(state, { type: 'SETTINGS_COMPLETED', settings, now });
}

export function isActiveMatch(state: GameState): boolean {
  return state.status !== 'idle' && state.status !== 'end_of_match';
}
