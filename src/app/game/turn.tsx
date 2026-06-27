import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { strings } from '@content/strings';
import { ActionButtons } from '@features/game/components/ActionButtons';
import { CountdownRing } from '@features/game/components/CountdownRing';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { AwardModal, PauseModal } from '@features/game/components/Modals';
import { WordCard } from '@features/game/components/WordCard';
import {
  useGameActions,
  useGameSelectors,
  useGameState,
  useTimer,
  useTurnLiveCounts,
  useWordText,
} from '@features/game/hooks';
import { playGuess, playSkip } from '@infrastructure/audio/sounds';
import { triggerHaptic } from '@infrastructure/haptics';
import { ScreenHeader } from '@ui/components/ScreenHeader';
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
  const { guesses, skips } = useTurnLiveCounts();
  const word = useWordText(turn?.currentWordId);
  const palette = getRoundPalette(currentRound?.type);

  const [awardSelection, setAwardSelection] = useState<string | null | undefined>(undefined);
  const [wordFeedback, setWordFeedback] = useState<'guess' | 'skip' | null>(null);

  const isAwaitingAward = status === 'awaiting_award';
  const teamName = currentTeam?.name ?? '—';

  const onGuess = useCallback(() => {
    void triggerHaptic('success');
    playGuess();
    setWordFeedback('guess');
    dispatch({ type: 'GUESS_WORD' });
    setTimeout(() => setWordFeedback(null), 250);
  }, [dispatch]);

  const onSkip = useCallback(() => {
    void triggerHaptic('warning');
    playSkip();
    setWordFeedback('skip');
    dispatch({ type: 'SKIP_WORD' });
    setTimeout(() => setWordFeedback(null), 250);
  }, [dispatch]);

  const onConfirmAward = useCallback(() => {
    if (awardSelection === undefined) {
      return;
    }
    void triggerHaptic('success');
    dispatch({ type: 'AWARD_WORD', toTeamId: awardSelection });
    setAwardSelection(undefined);
  }, [awardSelection, dispatch]);

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

  return (
    <GameScreenShell roundType={currentRound?.type}>
      <ScreenHeader showHome onHomePress={onPausePress} textColor={palette.text} />
      <View className="items-center px-4 pt-2">
        <Text style={{ color: palette.text }} className="text-lg font-semibold">
          — {teamName} —
        </Text>
      </View>

      <View className="flex-1 items-center justify-center gap-6">
        <WordCard
          word={word}
          backgroundColor={palette.card}
          textColor={palette.text}
          label={isAwaitingAward ? strings.turn.wordForAll : undefined}
          hideFromAccessibility={!isAwaitingAward}
          feedback={wordFeedback}
        />
        <CountdownRing
          remainingMs={isAwaitingAward ? 0 : remainingMs}
          totalMs={settings.turnDurationMs}
          textColor={palette.text}
          locked={isAwaitingAward}
        />
        {!isAwaitingAward ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.turn.pause}
            onPress={onPausePress}
            className="h-10 w-10 items-center justify-center"
          >
            <Text style={{ color: palette.text }} className="text-2xl">
              ‖
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="pb-8" style={{ opacity: isAwaitingAward ? 0.3 : 1 }}>
        <ActionButtons
          guessCount={guesses}
          skipCount={skips}
          onGuess={onGuess}
          onSkip={onSkip}
          disabled={isAwaitingAward}
        />
      </View>

      <PauseModal
        visible={pauseModalVisible && !isAwaitingAward}
        roundNumber={roundIndex + 1}
        teamName={teamName}
        onResume={onResume}
        onExit={onExit}
      />

      <AwardModal
        visible={isAwaitingAward}
        teams={teams}
        selectedTeamId={awardSelection}
        onSelect={setAwardSelection}
        onConfirm={onConfirmAward}
      />
    </GameScreenShell>
  );
}
