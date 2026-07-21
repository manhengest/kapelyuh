import { useRouter } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { ImageBackground, ScrollView, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { playEnd } from '@infrastructure/audio/sounds';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { ContentColumn } from '@ui/components/ContentColumn';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.png');

function WinnerMedal({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.5);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    scale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 100 }),
    );
  }, [reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function ResultsScreen() {
  const router = useRouter();
  const status = useGameState().status;
  const { scoreboard, winners } = useGameSelectors();
  const { abandonMatch } = useGameActions();
  const reducedMotion = useReducedMotion();
  const endSoundPlayed = useRef(false);

  useEffect(() => {
    if (status === 'end_of_match' && !endSoundPlayed.current) {
      endSoundPlayed.current = true;
      playEnd();
    }
  }, [status]);

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ContentColumn className="flex-1">
          <ScrollView className="flex-1 px-5" contentContainerClassName="py-8">
            <Text className="mb-1 text-center text-5xl leading-normal font-bold text-highlightText">
              {strings.results.matchComplete}
            </Text>
            <Text className="mb-6 text-center text-2xl text-slate-600">
              {strings.results.congrats}
            </Text>

            {winners.map((winner) => (
              <WinnerMedal key={winner.id}>
                <View className="mb-6 items-center rounded-3xl bg-yellow-100 px-4 py-6">
                  <Text className="text-4xl">🏅</Text>
                  <Text className="mt-2 text-3xl font-bold text-black">{winner.name}</Text>
                  <Text className="text-lg text-highlightText">
                    {winner.scores.elias + winner.scores.crocodile + winner.scores.association} балів
                  </Text>
                </View>
              </WinnerMedal>
            ))}

            <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <View className="flex-row px-3 py-2">
                <Text className="flex-1 text-lg font-bold text-black">Команда</Text>
                <Text className="w-10 text-center text-lg font-bold text-black">I</Text>
                <Text className="w-10 text-center text-lg font-bold text-black">II</Text>
                <Text className="w-10 text-center text-lg font-bold text-black">III</Text>
                <Text className="w-10 text-center text-lg">🏅</Text>
              </View>
              {scoreboard.map((row) => (
                <View key={row.teamId} className="flex-row border-t border-slate-200 px-3 py-2">
                  <Text className="flex-1 text-lg text-highlightText">{row.name}</Text>
                  <Text className="w-10 text-center text-lg text-highlightText">{row.scores.elias}</Text>
                  <Text className="w-10 text-center text-lg text-highlightText">
                    {row.scores.crocodile}
                  </Text>
                  <Text className="w-10 text-center text-lg text-highlightText">
                    {row.scores.association}
                  </Text>
                  <Text className="w-10 text-center text-lg font-semibold text-highlightText">
                    {row.total}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <ScreenFooter
            label={strings.home.newGame}
            onPress={() => {
              abandonMatch();
              router.replace('/');
            }}
          />
        </ContentColumn>
      </SafeAreaView>
      {!reducedMotion ? (
        <ConfettiCannon count={120} origin={{ x: 0, y: 0 }} fadeOut autoStart />
      ) : null}
    </ImageBackground>
  );
}
