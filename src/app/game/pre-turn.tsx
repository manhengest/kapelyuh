import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { strings } from '@content/strings';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { useGameActions, useGameSelectors } from '@features/game/hooks';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { Button } from '@ui/components/Button';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { getRoundPalette } from '@ui/theme/roundPalette';

const COUNTDOWN_VALUES = ['3', '2', '1'] as const;

export default function PreTurnScreen() {
  const router = useRouter();
  const { currentTeam, currentRound } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const palette = getRoundPalette(currentRound?.type);
  const reducedMotion = useReducedMotion();

  const [countdownIndex, setCountdownIndex] = useState<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  };

  const startCountdown = () => {
    clearTimers();
    if (reducedMotion) {
      dispatch({ type: 'START_TURN' });
      return;
    }

    setCountdownIndex(0);

    COUNTDOWN_VALUES.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCountdownIndex(index);
      }, index * 500);
      timersRef.current.push(timer);
    });

    const finishTimer = setTimeout(() => {
      setCountdownIndex(null);
      dispatch({ type: 'START_TURN' });
    }, COUNTDOWN_VALUES.length * 500);
    timersRef.current.push(finishTimer);
  };

  return (
    <GameScreenShell roundType={currentRound?.type}>
      <ScreenHeader
        showHome
        onHomePress={() => {
          clearTimers();
          abandonMatch();
          router.replace('/');
        }}
        textColor={palette.text}
      />
      <View className="flex-1 items-center justify-center px-6">
        <Text style={{ color: palette.text }} className="mb-4 text-center text-lg">
          {strings.preTurn.label}
        </Text>
        <Text style={{ color: palette.text }} className="text-center text-4xl font-bold">
          {currentTeam?.name ?? '—'}
        </Text>
      </View>
      <View className="px-5 pb-6">
        <Button label={strings.preTurn.start} onPress={startCountdown} />
      </View>

      {countdownIndex !== null ? (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <Text className="text-8xl font-bold text-white">
            {COUNTDOWN_VALUES[countdownIndex] ?? ''}
          </Text>
        </View>
      ) : null}
    </GameScreenShell>
  );
}
