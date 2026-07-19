import { useMemo } from 'react';
import { ImageBackground, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { formatGuessDurationSeconds } from '@domain/game/selectors';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { useGameStore } from '@features/game/store';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { AnimatedText, Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.png');

export default function StatisticScreen() {
  const statCardsRemaining = useGameState().statCardsRemaining;
  const { matchStats } = useGameSelectors();
  const { dispatch } = useGameActions();
  const cardOpacity = useSharedValue(1);

  const statCards = useMemo(() => {
    const cards: string[] = [];
    if (matchStats.fastestGuess) {
      cards.push(
        strings.results.stats.fastestGuess(
          matchStats.fastestGuess.wordText,
          formatGuessDurationSeconds(matchStats.fastestGuess.durationMs),
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
    if (matchStats.bestTurn) {
      cards.push(
        strings.results.stats.bestTurn(
          matchStats.bestTurn.teamName,
          matchStats.bestTurn.totalWordsGuessed,
        ),
      );
    }
    return cards.length > 0 ? cards : ['Гарна гра! Дякуємо, що грали разом.'];
  }, [matchStats]);

  const totalCards = statCards.length;
  const statIndex = totalCards - statCardsRemaining;

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

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScreenHeader title={strings.results.statisticTitle} />
        <View className="flex-1 justify-center px-6">
          <View className="rounded-3xl bg-white/80 px-8 py-6">
            <Text className="mb-4 text-center text-sm uppercase tracking-widest text-slate-400">
              {Math.min(statIndex + 1, totalCards)} / {totalCards}
            </Text>
            <AnimatedText
              style={carouselStyle}
              className="text-center text-xl font-bold leading-9 text-primaryText"
            >
              {statCards[Math.min(statIndex, totalCards - 1)]}
            </AnimatedText>
          </View>
        </View>
        <ScreenFooter
          label={strings.results.statNext}
          onPress={dismissStat}
          secondaryLabel={strings.results.statSkip}
          secondaryOnPress={skipToPodium}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}
