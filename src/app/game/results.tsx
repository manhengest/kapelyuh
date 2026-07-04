import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
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
import { useGameStore } from '@features/game/store';
import { playEnd } from '@infrastructure/audio/sounds';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { Button } from '@ui/components/Button';
import { AnimatedText, Text } from '@ui/components/Text';

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
  const statCardsRemaining = useGameState().statCardsRemaining;
  const { scoreboard, winners, matchStats } = useGameSelectors();
  const { dispatch } = useGameActions();
  const reducedMotion = useReducedMotion();
  const endSoundPlayed = useRef(false);
  const cardOpacity = useSharedValue(1);

  const statCards = useMemo(() => {
    const cards: string[] = [];
    if (matchStats.fastestGuess) {
      cards.push(
        strings.results.stats.fastestGuess(
          matchStats.fastestGuess.wordText,
          Math.round(matchStats.fastestGuess.durationMs / 1000),
        ),
      );
    }
    if (matchStats.mostSkippedWord) {
      cards.push(
        strings.results.stats.mostSkippedWord(
          matchStats.mostSkippedWord.wordText,
          matchStats.mostSkippedWord.skipCount,
        ),
      );
    }
    if (matchStats.bestRound) {
      cards.push(
        strings.results.stats.bestRound(
          matchStats.bestRound.teamNames.join(', '),
          matchStats.bestRound.totalWordsGuessed,
        ),
      );
    }
    return cards.length > 0 ? cards : ['Гарна гра! Дякуємо, що грали разом.'];
  }, [matchStats]);

  const isCarousel = status === 'stat_carousel';
  const totalCards = statCards.length;
  const statIndex = totalCards - statCardsRemaining;

  useEffect(() => {
    if (status === 'end_of_match' && !endSoundPlayed.current) {
      endSoundPlayed.current = true;
      playEnd();
    }
  }, [status]);

  const dismissStat = () => {
    cardOpacity.value = withTiming(0.95, { duration: 90 });
    cardOpacity.value = withTiming(1, { duration: 90 });
    dispatch({ type: 'DISMISS_STAT_CAROUSEL' });
  };

  const skipToPodium = () => {
    let remaining = useGameStore.getState().state.statCardsRemaining;
    while (remaining > 0) {
      dispatch({ type: 'DISMISS_STAT_CAROUSEL' });
      remaining -= 1;
    }
  };

  const carouselStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardOpacity.value }],
  }));

  const replay = () => {
    dispatch({ type: 'REPLAY_WITH_SAME_TEAMS' });
  };

  if (isCarousel) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <View className="flex-1 justify-center px-6">
          <Text className="mb-4 text-center text-sm uppercase tracking-widest text-slate-400">
            {Math.min(statIndex + 1, totalCards)} / {totalCards}
          </Text>
          <AnimatedText
            style={carouselStyle}
            className="text-center text-2xl font-bold leading-9 text-white"
          >
            {statCards[Math.min(statIndex, totalCards - 1)]}
          </AnimatedText>
        </View>
        <View className="gap-3 px-5 pb-6">
          <Button label={strings.results.statNext} onPress={dismissStat} />
          <Button label={strings.results.statSkip} variant="outline" onPress={skipToPodium} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!reducedMotion ? (
        <ConfettiCannon count={120} origin={{ x: 0, y: 0 }} fadeOut autoStart />
      ) : null}
      <ScrollView className="flex-1 px-5" contentContainerClassName="py-8">
        <Text className="mb-1 text-center text-2xl font-bold text-slate-900">
          {strings.results.matchComplete}
        </Text>
        <Text className="mb-6 text-center text-lg text-slate-600">
          {strings.results.congrats}
        </Text>

        {winners.map((winner) => (
          <WinnerMedal key={winner.id}>
            <View className="mb-6 items-center rounded-3xl bg-yellow-100 px-4 py-6">
              <Text className="text-4xl">🏅</Text>
              <Text className="mt-2 text-2xl font-bold text-slate-900">{winner.name}</Text>
              <Text className="text-lg text-slate-700">
                {winner.scores.elias + winner.scores.crocodile + winner.scores.association} балів
              </Text>
            </View>
          </WinnerMedal>
        ))}

        <View className="overflow-hidden rounded-2xl border border-slate-200">
          <View className="flex-row bg-slate-100 px-3 py-2">
            <Text className="flex-1 text-xs font-bold text-slate-700">Команда</Text>
            <Text className="w-10 text-center text-xs font-bold text-slate-700">I</Text>
            <Text className="w-10 text-center text-xs font-bold text-slate-700">II</Text>
            <Text className="w-10 text-center text-xs font-bold text-slate-700">III</Text>
            <Text className="w-10 text-center text-xs font-bold text-slate-700">🏅</Text>
          </View>
          {scoreboard.map((row) => (
            <View key={row.teamId} className="flex-row border-t border-slate-200 px-3 py-2">
              <Text className="flex-1 text-sm text-slate-900">{row.name}</Text>
              <Text className="w-10 text-center text-sm text-slate-900">{row.scores.elias}</Text>
              <Text className="w-10 text-center text-sm text-slate-900">{row.scores.crocodile}</Text>
              <Text className="w-10 text-center text-sm text-slate-900">{row.scores.association}</Text>
              <Text className="w-10 text-center text-sm font-semibold text-slate-900">{row.total}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="gap-3 px-5 pb-6">
        <Button label={strings.results.playAgain} onPress={replay} />
        <Button label={strings.home.newGame} variant="outline" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}
