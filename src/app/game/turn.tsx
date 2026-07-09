import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { strings } from '@content/strings';
import { ActionButtons } from '@features/game/components/ActionButtons';
import { CountdownRing } from '@features/game/components/CountdownRing';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { AwardModal, PauseModal } from '@features/game/components/Modals';
import { WordCard } from '@features/game/components/WordCard';
import {
  getRoundMeta,
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
  const { guesses, skips } = useTurnLiveCounts();
  const word = useWordText(turn?.currentWordId);
  const palette = getRoundPalette(currentRound?.type);
  const roundMeta = getRoundMeta(currentRound?.type);

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
      <ScreenHeader onBack={onPausePress} />

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
        <View
          className="mt-1 rounded-full px-4 py-1 bg-white"
        >
          <Text className="text-base font-bold tracking-widest" style={{ color: palette.text }}>
            {roundMeta.name}
          </Text>
        </View>
      </View>

      {/* Timer pill */}
      <View className="items-center">
        <CountdownRing
          remainingMs={isAwaitingAward ? 0 : remainingMs}
          totalMs={settings.turnDurationMs}
          textColor={palette.text}
          locked={isAwaitingAward}
        />
      </View>

      {/* Word card */}
      <View className="flex-1 items-center justify-center pb-16">
        <WordCard
          word={word}
          backgroundColor={palette.card}
          textColor={palette.wordText}
          label={isAwaitingAward ? strings.turn.wordForAll : undefined}
          hideFromAccessibility={!isAwaitingAward}
          feedback={wordFeedback}
        />
      </View>

      {/* Action buttons */}
      <View className="pb-8" style={{ opacity: isAwaitingAward ? 0.3 : 1 }}>
        <ActionButtons
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
