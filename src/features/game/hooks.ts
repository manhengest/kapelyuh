import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { computeTurnScore, deriveWordOutcome } from '@domain/game/scoring';
import {
  selectCurrentRound,
  selectCurrentTeam,
  selectIsCarryOver,
  selectIsHatEmpty,
  selectMatchStats,
  selectReviewBanner,
  selectReviewCta,
  selectScoreboard,
  selectUpcomingTurnDurationMs,
  selectWinners,
} from '@domain/game/selectors';
import type { GameStatus, MatchSettings, RoundType, Team } from '@domain/game/types';
import { playTimerEnd } from '@infrastructure/audio/sounds';
import { triggerHaptic } from '@infrastructure/haptics';
import { useAppStatePause } from '@shared/hooks/useAppStatePause';

import { useGameStore } from './store';
import { useWordTextMap, useWordText as lookupWordText } from './useWordTextMap';

export function useGameState() {
  return useGameStore((store) => store.state);
}

export function useGameActions() {
  const dispatch = useGameStore((store) => store.dispatch);
  const abandonMatch = useGameStore((store) => store.abandonMatch);
  const setPauseModalVisible = useGameStore((store) => store.setPauseModalVisible);

  return { dispatch, abandonMatch, setPauseModalVisible };
}

export function useGameSelectors() {
  const state = useGameState();
  const { wordTexts } = useWordTextMap();

  return useMemo(
    () => ({
      currentTeam: selectCurrentTeam(state),
      currentRound: selectCurrentRound(state),
      isHatEmpty: selectIsHatEmpty(state),
      reviewBanner: selectReviewBanner(state),
      reviewCta: selectReviewCta(state),
      scoreboard: selectScoreboard(state),
      winners: selectWinners(state),
      matchStats: selectMatchStats(state.turnHistory, state.teams, wordTexts),
      isCarryOver: selectIsCarryOver(state),
      upcomingTurnDurationMs: selectUpcomingTurnDurationMs(state),
      wordTexts,
    }),
    [state, wordTexts],
  );
}

export function useWordText(wordId: string | null | undefined): string {
  const { wordTexts } = useWordTextMap();
  return lookupWordText(wordId, wordTexts);
}

export function useReviewWords() {
  const state = useGameState();
  const turn = state.turn;
  const { wordTexts } = useWordTextMap();

  return useMemo(() => {
    if (!turn) {
      return [];
    }

    const ids = new Set<string>();
    for (const event of turn.events) {
      if (event.kind === 'guessed' || event.kind === 'skipped') {
        ids.add(event.wordId);
      }
    }

    // Only guessed/skipped words are reviewable. Awarded words — including
    // «Ніхто не вгадав» — must not appear on the review screen.
    return [...ids].flatMap((wordId) => {
      const outcome = deriveWordOutcome(turn.events, wordId);
      if (outcome !== 'guessed' && outcome !== 'skipped') {
        return [];
      }
      return [
        {
          wordId,
          text: wordTexts[wordId] ?? wordId,
          outcome,
        },
      ];
    });
  }, [turn, wordTexts]);
}

export function useTurnNetScore() {
  const state = useGameState();
  const turn = state.turn;
  if (!turn) {
    return 0;
  }
  return computeTurnScore(turn.events, state.settings.skipPenalty);
}

export function useTimer() {
  const status = useGameStore((store) => store.state.status);
  const turn = useGameStore((store) => store.state.turn);
  const dispatch = useGameStore((store) => store.dispatch);
  const pauseModalVisible = useGameStore((store) => store.pauseModalVisible);
  const setPauseModalVisible = useGameStore((store) => store.setPauseModalVisible);

  const [liveRemainingMs, setLiveRemainingMs] = useState(0);
  const expiredRef = useRef(false);
  const haptic10Ref = useRef(false);
  const haptic3Ref = useRef(false);
  const soundTimerEndRef = useRef(false);

  const isTimerActive = status === 'in_turn' && turn != null && turn.pausedAt == null;

  useKeepAwake(isTimerActive ? 'kapelyukh-turn' : undefined);

  useEffect(() => {
    expiredRef.current = false;
    haptic10Ref.current = false;
    haptic3Ref.current = false;
    soundTimerEndRef.current = false;
  }, [turn?.startedAt, turn?.teamId]);

  useEffect(() => {
    if (!isTimerActive || !turn) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, turn.endsAt - now);
      setLiveRemainingMs(remaining);

      if (remaining <= 10_000 && remaining > 9_000 && !haptic10Ref.current) {
        haptic10Ref.current = true;
        void triggerHaptic('heavy');
        AccessibilityInfo.announceForAccessibility('Залишилось 10 секунд');
      }
      if (remaining <= 3_000 && remaining > 2_900 && !haptic3Ref.current) {
        haptic3Ref.current = true;
        void triggerHaptic('heavy');
        AccessibilityInfo.announceForAccessibility('Залишилось 3 секунди');
      }
      if (remaining <= 5_000 && remaining > 4_900 && !soundTimerEndRef.current) {
        soundTimerEndRef.current = true;
        playTimerEnd();
      }
      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        void triggerHaptic('heavy');
        dispatch({ type: 'TIMER_EXPIRED' });
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [dispatch, isTimerActive, turn]);

  const remainingMs =
    !turn || status !== 'in_turn'
      ? 0
      : turn.pausedAt != null
        ? (turn.remainingOnPauseMs ?? 0)
        : liveRemainingMs;

  const pause = useCallback(() => {
    if (status === 'in_turn' || status === 'awaiting_award') {
      dispatch({ type: 'PAUSE' });
      setPauseModalVisible(true);
    }
  }, [dispatch, setPauseModalVisible, status]);

  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' });
    setPauseModalVisible(false);
  }, [dispatch, setPauseModalVisible]);

  useAppStatePause({
    enabled: isTimerActive,
    onBackground: () => {
      dispatch({ type: 'PAUSE' });
      setPauseModalVisible(true);
    },
    onForeground: () => {
      // Keep modal open until user taps resume.
    },
  });

  return {
    remainingMs,
    isPaused: turn?.pausedAt != null || pauseModalVisible,
    pause,
    resume,
    pauseModalVisible,
    setPauseModalVisible,
  };
}

export const STATUS_ROUTE: Partial<Record<GameStatus, string>> = {
  setup_settings: '/game/setup',
  setup_teams: '/game/teams',
  round_intro: '/game/round-intro',
  in_turn: '/game/turn',
  awaiting_award: '/game/turn',
  review: '/game/review',
  stat_carousel: '/game/statistic',
  end_of_match: '/game/results',
};

export function getRoundMeta(roundType: RoundType | undefined) {
  switch (roundType) {
    case 'crocodile':
      return { name: 'КРОКОДИЛ', hint: 'Показуй слово жестами' };
    case 'association':
      return { name: 'АСОЦІАЦІЯ', hint: 'Одне асоціативне слово' };
    default:
      return { name: 'ЕЛІАС', hint: 'Пояснюй іншими словами' };
  }
}

export type { MatchSettings, Team };
