import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { strings } from '@content/strings';
import { ActionButtons } from '@features/game/components/ActionButtons';
import { CountdownRing } from '@features/game/components/CountdownRing';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { AwardModal, PauseModal } from '@features/game/components/Modals';
import { PauseIcon } from '@features/game/components/PauseIcon';
import { WordCardStack, type WordCardStackHandle } from '@features/game/components/WordCardStack';
import type { WordCardAction } from '@features/game/components/wordCardStackConfig';
import {
  getRoundMeta,
  useGameActions,
  useGameSelectors,
  useGameState,
  useTimer,
} from '@features/game/hooks';
import { useGameStore } from '@features/game/store';
import { useWordTextMap } from '@features/game/useWordTextMap';
import { playGuess, playSkip } from '@infrastructure/audio/sounds';
import { triggerHaptic } from '@infrastructure/haptics';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';
import { getRoundPalette } from '@ui/theme/roundPalette';

export default function TurnScreen() {
  const router = useRouter();
  const status = useGameState().status;
  const settings = useGameState().settings;
  const teams = useGameState().teams;
  const turn = useGameState().turn;
  const roundIndex = useGameState().currentRoundIndex;
  const { currentTeam, currentRound } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const { remainingMs, pause, resume, pauseModalVisible, setPauseModalVisible } = useTimer();
  const palette = getRoundPalette(currentRound?.type);
  const roundMeta = getRoundMeta(currentRound?.type);
  const { wordTexts } = useWordTextMap();
  const queueWordIds = currentRound?.remainingWordIds ?? [];
  const guessedWordIds = currentRound?.guessedWordIds ?? [];

  const [awardSelection, setAwardSelection] = useState<string | null | undefined>(undefined);
  const [awardModalVisible, setAwardModalVisible] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const wordCardStackRef = useRef<WordCardStackHandle>(null);
  const pendingActionRef = useRef<WordCardAction | null>(null);

  const isAwaitingAward = status === 'awaiting_award';
  const teamName = currentTeam?.name ?? '—';
  const currentWordId = turn?.currentWordId ?? null;

  const commitPendingAction = useCallback(
    (action: WordCardAction) => {
      const currentStatus = useGameStore.getState().state.status;
      if (currentStatus !== 'in_turn') {
        return;
      }
      dispatch({ type: action === 'guess' ? 'GUESS_WORD' : 'SKIP_WORD' });
    },
    [dispatch],
  );

  const flushPendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    if (!action) {
      return;
    }

    pendingActionRef.current = null;
    commitPendingAction(action);
    wordCardStackRef.current?.resetExit();
    setActionBusy(false);
  }, [commitPendingAction]);

  const onExitComplete = useCallback(
    (action: WordCardAction) => {
      pendingActionRef.current = null;
      commitPendingAction(action);
      setActionBusy(false);
    },
    [commitPendingAction],
  );

  const startWordAction = useCallback(
    (action: WordCardAction) => {
      if (actionBusy) {
        return;
      }

      if (action === 'guess') {
        void triggerHaptic('success');
        playGuess();
      } else {
        void triggerHaptic('warning');
        playSkip();
      }

      pendingActionRef.current = action;
      const started = wordCardStackRef.current?.startExit(action);
      if (started) {
        setActionBusy(true);
        return;
      }

      pendingActionRef.current = null;
    },
    [actionBusy],
  );

  const onGuess = useCallback(() => {
    if (isAwaitingAward) {
      void triggerHaptic('success');
      playGuess();
      setAwardModalVisible(true);
      return;
    }
    startWordAction('guess');
  }, [isAwaitingAward, startWordAction]);

  const onSkip = useCallback(() => {
    if (isAwaitingAward) {
      void triggerHaptic('warning');
      playSkip();
      dispatch({ type: 'AWARD_WORD', toTeamId: null });
      return;
    }
    startWordAction('skip');
  }, [dispatch, isAwaitingAward, startWordAction]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState.match(/inactive|background/) && pendingActionRef.current) {
        flushPendingAction();
      }
    });

    return () => subscription.remove();
  }, [flushPendingAction]);

  const onConfirmAward = () => {
    if (awardSelection === undefined) {
      return;
    }
    void triggerHaptic('success');
    dispatch({ type: 'AWARD_WORD', toTeamId: awardSelection });
    setAwardSelection(undefined);
    setAwardModalVisible(false);
  };

  const onPausePress = useCallback(() => {
    void triggerHaptic('light');
    pause();
  }, [pause]);

  const onResume = useCallback(() => {
    void triggerHaptic('light');
    resume();
  }, [resume]);

  const onExit = useCallback(() => {
    abandonMatch();
    setPauseModalVisible(false);
    router.replace('/');
  }, [abandonMatch, router, setPauseModalVisible]);

  const showPauseButton = !pauseModalVisible;
  const actionsDisabled = actionBusy || pauseModalVisible;

  return (
    <GameScreenShell roundType={currentRound?.type}>
      <ScreenHeader onBack={onPausePress} backIcon="home" />

      {/* Team name + round info */}
      <View className="items-center pb-4">
        <Text className="text-base font-semibold" style={{ color: palette.wordText }}>
          {strings.rounds.roundLabel(roundIndex + 1, 3)}
        </Text>
        <Text
          className="text-2xl font-bold"
          style={{ color: palette.text }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {teamName}
        </Text>
        <View className="mt-1 rounded-full bg-white px-4 py-1">
          <Text className="text-base font-bold tracking-widest" style={{ color: palette.text }}>
            {roundMeta.name}
          </Text>
        </View>
      </View>

      {/* Timer pill */}
      <View className="items-center">
        <CountdownRing
          remainingMs={isAwaitingAward ? 0 : remainingMs}
          totalMs={turn?.durationMs ?? settings.turnDurationMs}
          textColor={palette.text}
          locked={isAwaitingAward}
        />
      </View>

      {/* Word card + pause */}
      <View className="flex-1 items-center justify-center pb-8">
        <WordCardStack
          ref={wordCardStackRef}
          currentWordId={currentWordId}
          remainingWordIds={queueWordIds}
          wordTexts={wordTexts}
          backgroundColor={palette.card}
          textColor={palette.wordText}
          label={isAwaitingAward ? strings.turn.wordForAll : undefined}
          onExitComplete={onExitComplete}
        />
        {showPauseButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.turn.pause}
            onPress={onPausePress}
            className="mt-4 h-12 w-12 items-center justify-center"
          >
            <PauseIcon color={palette.text} size={20} />
          </Pressable>
        ) : (
          <View className="mt-4 h-12 w-12" />
        )}
      </View>

      {/* Action buttons */}
      <View className="pb-8">
        <ActionButtons
          onGuess={onGuess}
          onSkip={onSkip}
          guessDisabled={actionsDisabled}
          skipDisabled={actionsDisabled}
        />
      </View>

      <PauseModal
        visible={pauseModalVisible}
        roundLine={strings.pause.round(roundMeta.name)}
        teamName={teamName}
        onResume={onResume}
        onExit={onExit}
      />

      <AwardModal
        visible={awardModalVisible}
        teams={teams}
        selectedTeamId={awardSelection}
        onSelect={setAwardSelection}
        onConfirm={onConfirmAward}
      />

      {false && (
        <>
          <View className="absolute left-4 top-36 max-w-[35%] bg-white p-2" pointerEvents="none">
            <Text className="text-[12px] font-bold text-highlightText">
              QUEUE ({queueWordIds.length})
            </Text>
            {queueWordIds.map((id) => (
              <Text key={id} className="text-[10px] text-highlightText">
                {wordTexts[id] ?? id}
              </Text>
            ))}
          </View>

          <View className="absolute right-4 top-36 max-w-[35%] bg-white p-2" pointerEvents="none">
            <Text className="text-[10px] font-bold text-highlightText">
              GUESSED ({guessedWordIds.length})
            </Text>
            {guessedWordIds.map((id) => (
              <Text key={id} className="text-[12px] text-highlightText">
                {wordTexts[id] ?? id}
              </Text>
            ))}
          </View>
        </>
      )}
    </GameScreenShell>
  );
}
