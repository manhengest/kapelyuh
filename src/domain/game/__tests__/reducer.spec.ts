import { describe, expect, it } from '@jest/globals';

import {
  createInitialState,
  gameReducer,
  isActiveMatch,
  SCORE,
  selectSessionWords,
} from '@domain/game';
import {
  selectIsHatEmpty,
  selectReviewBanner,
  selectReviewCta,
  selectScoreboard,
} from '@domain/game/selectors';

import {
  BASE_TIME,
  awardWord,
  expireTimer,
  getCurrentRoundScore,
  guessCurrentWord,
  makeSettings,
  makeTeam,
  nextRound,
  nextTurn,
  skipCurrentWord,
  startMatch,
  submitReview,
} from './helpers';

describe('domain/game/reducer', () => {
  it('walks through setup into first turn', () => {
    const state = startMatch(['w1', 'w2', 'w3']);
    expect(state.status).toBe('in_turn');
    expect(state.rounds).toHaveLength(1);
    expect(state.rounds[0]?.type).toBe('elias');
    expect(state.rounds[0]?.sessionWordIds).toEqual(['w1', 'w2', 'w3']);
  });

  it('timer-expiry-mid-word enters awaiting_award then resolves to review', () => {
    let state = startMatch(['w1', 'w2']);
    expect(state.turn?.currentWordId).toBeTruthy();

    state = expireTimer(state);
    expect(state.status).toBe('awaiting_award');

    state = awardWord(state, 't2');
    expect(state.status).toBe('review');
    expect(getCurrentRoundScore(state, 't2')).toBe(1);
    expect(selectReviewBanner(state)).toBe('time_up');
  });

  it('skip-FIFO recycling returns skipped words to the queue tail', () => {
    let state = startMatch(['w1', 'w2', 'w3']);
    const firstWord = state.turn?.currentWordId;

    state = skipCurrentWord(state);
    const round = state.rounds[0];
    expect(round?.remainingWordIds.at(-1)).toBe(firstWord);
    expect(state.turn?.currentWordId).not.toBe(firstWord);
  });

  it('applies skip penalty when configured', () => {
    let state = startMatch(['w1', 'w2', 'w3'], undefined, makeSettings({ skipPenalty: -1 }));
    state = guessCurrentWord(state);
    state = skipCurrentWord(state);

    expect(getCurrentRoundScore(state, 't1')).toBe(0);
  });

  it('review-toggle applies -2 when skip penalty is enabled', () => {
    let state = startMatch(['w1', 'w2'], undefined, makeSettings({ skipPenalty: -1 }));
    state = guessCurrentWord(state);
    const guessedWordId = state.turn?.events.find((event) => event.kind === 'guessed')?.wordId;
    expect(getCurrentRoundScore(state, 't1')).toBe(1);

    state = expireTimer(state);
    state = awardWord(state, null);
    state = submitReview(state, { [guessedWordId!]: 'skipped' });
    expect(getCurrentRoundScore(state, 't1')).toBe(0);
  });

  it('hat-empty round transition offers next round CTA', () => {
    let state = startMatch(['w1']);
    state = guessCurrentWord(state);

    expect(state.status).toBe('review');
    expect(selectIsHatEmpty(state)).toBe(true);
    expect(selectReviewCta(state)).toBe('next_round');
  });

  it('moves to the next round with reshuffled words from the same session pool', () => {
    let state = startMatch(['w1', 'w2']);
    state = guessCurrentWord(state);
    state = guessCurrentWord(state);
    state = nextRound(state);

    expect(state.status).toBe('round_intro');
    expect(state.currentRoundIndex).toBe(1);
    expect(state.rounds[1]?.type).toBe('crocodile');
    expect(state.rounds[1]?.sessionWordIds).toEqual(['w1', 'w2']);
    expect(state.rounds[1]?.remainingWordIds.sort()).toEqual(['w1', 'w2']);
  });

  it('continues the round with the next team when the hat is not empty', () => {
    let state = startMatch(['w1', 'w2', 'w3']);
    state = expireTimer(state);
    state = awardWord(state, null);
    state = nextTurn(state);

    expect(state.status).toBe('round_intro');
    expect(state.currentTeamIndex).toBe(1);
    expect(selectIsHatEmpty(state)).toBe(false);
  });

  it('clamps stored team scores at zero', () => {
    let state = startMatch(['w1', 'w2', 'w3'], undefined, makeSettings({ skipPenalty: -1 }));
    state = skipCurrentWord(state);
    state = skipCurrentWord(state);
    state = skipCurrentWord(state);
    state = expireTimer(state);
    state = awardWord(state, null);

    expect(getCurrentRoundScore(state, 't1')).toBe(0);
    expect(selectScoreboard(state)[0]?.scores.elias).toBe(0);
  });

  it('pauses and resumes by shifting turn end time', () => {
    let state = startMatch(['w1', 'w2']);
    const endsAt = state.turn?.endsAt ?? 0;

    state = gameReducer(state, { type: 'PAUSE', now: BASE_TIME + 10_000 });
    expect(state.turn?.pausedAt).toBe(BASE_TIME + 10_000);
    expect(state.turn?.remainingOnPauseMs).toBe(50_000);

    state = gameReducer(state, { type: 'RESUME', now: BASE_TIME + 20_000 });
    expect(state.turn?.endsAt).toBe(BASE_TIME + 20_000 + 50_000);
    expect(state.turn?.pausedAt).toBeNull();
    expect(state.turn?.endsAt).toBeGreaterThan(endsAt);
  });

  it('opens stat carousel after final round and dismisses into end_of_match', () => {
    let state = startMatch(['w1']);
    state = guessCurrentWord(state);

    state = gameReducer(state, { type: 'OPEN_STAT_CAROUSEL', cardCount: 3, now: BASE_TIME });
    expect(state.status).toBe('stat_carousel');
    expect(state.statCardsRemaining).toBe(3);

    for (let index = 0; index < 2; index += 1) {
      state = gameReducer(state, { type: 'DISMISS_STAT_CAROUSEL', now: BASE_TIME + index });
      expect(state.status).toBe('stat_carousel');
    }

    state = gameReducer(state, { type: 'DISMISS_STAT_CAROUSEL', now: BASE_TIME + 10 });
    expect(state.status).toBe('end_of_match');
  });

  it('replays with the same teams and settings after match end', () => {
    let state = startMatch(['w1']);
    state = guessCurrentWord(state);
    state = gameReducer(state, { type: 'OPEN_STAT_CAROUSEL', cardCount: 3, now: BASE_TIME });
    for (let index = 0; index < 3; index += 1) {
      state = gameReducer(state, { type: 'DISMISS_STAT_CAROUSEL', now: BASE_TIME + index });
    }

    state = gameReducer(state, { type: 'REPLAY_WITH_SAME_TEAMS', now: BASE_TIME + 100 });
    expect(state.status).toBe('setup_teams');
    expect(state.teams.map((team) => team.name)).toEqual(['Команда 1', 'Команда 2']);
    expect(state.teams.every((team) => team.scores.elias === 0)).toBe(true);
  });

  it('abandons an active match back to idle', () => {
    let state = startMatch(['w1', 'w2']);
    state = gameReducer(state, { type: 'ABANDON_MATCH', now: BASE_TIME });
    expect(state.status).toBe('idle');
    expect(state.teams).toHaveLength(0);
  });

  it('rejects invalid transitions', () => {
    const state = createInitialState();
    expect(() => gameReducer(state, { type: 'GUESS_WORD', now: BASE_TIME })).toThrow(
      /Invalid transition/,
    );
  });

  it('awarding to nobody gives zero points and returns the word to the hat', () => {
    let state = startMatch(['w1', 'w2']);
    const awardedWordId = state.turn?.currentWordId;
    state = expireTimer(state);
    state = awardWord(state, null);

    expect(getCurrentRoundScore(state, 't1')).toBe(0);
    expect(getCurrentRoundScore(state, 't2')).toBe(0);
    expect(state.rounds[0]?.guessedWordIds).not.toContain(awardedWordId);
    expect(state.rounds[0]?.remainingWordIds).toContain(awardedWordId);
    expect(selectIsHatEmpty(state)).toBe(false);
    const awarded = state.turn?.events.find((e) => e.kind === 'awarded');
    expect(awarded).toMatchObject({ wordId: awardedWordId, toTeamId: null });
  });

  it('awards «Слово для всіх» to any team and removes the word from the hat', () => {
    let state = startMatch(['w1', 'w2']);
    const awardedWordId = state.turn?.currentWordId;
    state = expireTimer(state);
    state = awardWord(state, 't2');

    expect(selectIsHatEmpty(state)).toBe(false);
    expect(getCurrentRoundScore(state, 't2')).toBe(1);
    expect(state.rounds[0]?.guessedWordIds).toContain(awardedWordId);
  });

  it('records turn history when advancing from review', () => {
    let state = startMatch(['w1', 'w2', 'w3']);
    state = guessCurrentWord(state);
    state = expireTimer(state);
    state = awardWord(state, null);
    expect(state.turnHistory).toHaveLength(0);

    state = nextTurn(state);
    expect(state.turnHistory).toHaveLength(1);
    expect(state.turnHistory[0]?.teamId).toBe('t1');
  });

  it('ignores pause when already paused', () => {
    let state = startMatch(['w1', 'w2']);
    state = gameReducer(state, { type: 'PAUSE', now: BASE_TIME + 1_000 });
    const paused = state.turn?.pausedAt;
    state = gameReducer(state, { type: 'PAUSE', now: BASE_TIME + 2_000 });
    expect(state.turn?.pausedAt).toBe(paused);
  });

  it('accepts SETTINGS_COMPLETED from idle during quick start flows', () => {
    let state = createInitialState(BASE_TIME);
    state = gameReducer(state, {
      type: 'SETTINGS_COMPLETED',
      settings: makeSettings(),
      now: BASE_TIME,
    });
    expect(state.status).toBe('setup_teams');
  });

  it('exports the public domain barrel', () => {
    expect(gameReducer).toBeDefined();
    expect(selectSessionWords).toBeDefined();
    expect(SCORE.guess).toBe(1);
    expect(isActiveMatch(createInitialState())).toBe(false);
  });

  it('throws when attempting to start a turn with an empty hat', () => {
    let state = startMatch(['w1']);
    state = guessCurrentWord(state); // empties the hat → review
    state = nextTurn(state); // transitions to round_intro
    expect(() => gameReducer(state, { type: 'ROUND_INTRO_ACK', now: BASE_TIME })).toThrow(/empty hat/);
  });

  it('ignores duplicate START_SETUP when a match is already being configured', () => {
    let state = createInitialState(BASE_TIME);
    state = gameReducer(state, { type: 'START_SETUP', now: BASE_TIME });
    state = gameReducer(state, { type: 'START_SETUP', now: BASE_TIME + 1 });
    expect(state.status).toBe('setup_settings');
    expect(state.updatedAt).toBe(BASE_TIME);
  });
});

describe('domain/game/reducer carry-over time', () => {
  it('carries over leftover time when the hat empties with ≥10s remaining', () => {
    let state = startMatch(['w1', 'w2']);
    state = guessCurrentWord(state, BASE_TIME + 10_000);
    state = guessCurrentWord(state, BASE_TIME + 20_000);

    expect(state.status).toBe('review');
    expect(state.carryOverMs).toBe(40_000);
  });

  it('keeps the same team and consumes the carry-over on NEXT_ROUND', () => {
    let state = startMatch(['w1', 'w2']);
    state = guessCurrentWord(state, BASE_TIME + 10_000);
    state = guessCurrentWord(state, BASE_TIME + 20_000);
    expect(state.currentTeamIndex).toBe(0);

    state = nextRound(state);
    expect(state.currentTeamIndex).toBe(0);
    expect(state.carryOverMs).toBe(40_000);

    const ackAt = BASE_TIME + 130_000;
    state = gameReducer(state, { type: 'ROUND_INTRO_ACK', now: ackAt });

    expect(state.carryOverMs).toBeNull();
    expect(state.turn?.durationMs).toBe(40_000);
    expect((state.turn?.endsAt ?? 0) - ackAt).toBe(40_000);
  });

  it('does not carry over when the hat empties via timeout/award (leftover is 0)', () => {
    let state = startMatch(['w1']);
    state = expireTimer(state);
    state = awardWord(state, 't2');

    expect(state.status).toBe('review');
    expect(selectIsHatEmpty(state)).toBe(true);
    expect(state.carryOverMs).toBeNull();

    state = nextRound(state);
    expect(state.currentTeamIndex).toBe(0);
  });

  it('does not carry over when leftover is below the 10s threshold', () => {
    let state = startMatch(['w1', 'w2']);
    state = guessCurrentWord(state, BASE_TIME + 52_000);
    state = guessCurrentWord(state, BASE_TIME + 55_000);

    expect(state.carryOverMs).toBeNull();

    state = nextRound(state);
    expect(state.currentTeamIndex).toBe(0);
  });

  it('does not carry over past the last round', () => {
    let state = startMatch(['w1']);
    state = guessCurrentWord(state, BASE_TIME + 5_000);
    state = nextRound(state); // -> crocodile
    state = gameReducer(state, { type: 'ROUND_INTRO_ACK', now: BASE_TIME + 120_000 });
    state = guessCurrentWord(state, BASE_TIME + 125_000);
    state = nextRound(state); // -> association (last round)
    state = gameReducer(state, { type: 'ROUND_INTRO_ACK', now: BASE_TIME + 240_000 });

    state = guessCurrentWord(state, BASE_TIME + 245_000);

    expect(state.status).toBe('review');
    expect(state.currentRoundIndex).toBe(2);
    expect(state.carryOverMs).toBeNull();
  });
});

describe('domain/game/reducer team setup', () => {
  it('requires teams from TEAMS_COMPLETED payload', () => {
    let state = createInitialState(BASE_TIME);
    state = gameReducer(state, { type: 'START_SETUP', now: BASE_TIME });
    state = gameReducer(state, {
      type: 'SETTINGS_COMPLETED',
      settings: makeSettings(),
      now: BASE_TIME,
    });

    state = gameReducer(state, {
      type: 'TEAMS_COMPLETED',
      teams: [makeTeam('a', 'А'), makeTeam('b', 'Б')],
      sessionWordIds: ['w1'],
      now: BASE_TIME,
    });

    expect(state.teams).toHaveLength(2);
    expect(state.teams[0]?.scores).toEqual({
      elias: 0,
      crocodile: 0,
      association: 0,
    });
  });
});
