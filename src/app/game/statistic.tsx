import { useMemo } from 'react';
import { Image, ImageBackground, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { formatGuessDurationSeconds } from '@domain/game/selectors';
import { skipIcon } from '@features/game/components/turnActionIcons';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { useGameStore } from '@features/game/store';
import { ClockIcon } from '@ui/components/ClockIcon';
import { ContentColumn } from '@ui/components/ContentColumn';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { StarIcon } from '@ui/components/StarIcon';
import { AnimatedText, Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.jpg');
const statIconColor = '#FE7298';
const statIconSize = 48;

type StatCardKind = 'fast' | 'skip' | 'best' | 'duration' | 'fallback';

type StatCard = {
  kind: StatCardKind;
  text: string;
};

function StatCardIcon({ kind }: { kind: StatCardKind }) {
  switch (kind) {
    case 'fast':
    case 'duration':
      return <ClockIcon color={statIconColor} size={statIconSize} />;
    case 'skip':
      return (
        <Image
          source={skipIcon}
          style={{ width: statIconSize, height: statIconSize }}
          resizeMode="contain"
        />
      );
    case 'best':
      return <StarIcon color={statIconColor} size={statIconSize} />;
    default:
      return null;
  }
}

export default function StatisticScreen() {
  const statCardsRemaining = useGameState().statCardsRemaining;
  const { matchStats } = useGameSelectors();
  const { dispatch } = useGameActions();
  const cardOpacity = useSharedValue(1);

  const statCards = useMemo((): StatCard[] => {
    const cards: StatCard[] = [];
    if (matchStats.fastestGuess) {
      cards.push({
        kind: 'fast',
        text: strings.results.stats.fastestGuess(
          matchStats.fastestGuess.wordText,
          formatGuessDurationSeconds(matchStats.fastestGuess.durationMs),
        ),
      });
    }
    if (matchStats.mostSkippedWord) {
      cards.push({
        kind: 'skip',
        text: strings.results.stats.mostSkippedWord(
          matchStats.mostSkippedWord.wordText,
          matchStats.mostSkippedWord.skipCount,
        ),
      });
    }
    if (matchStats.bestTurn) {
      cards.push({
        kind: 'best',
        text: strings.results.stats.bestTurn(
          matchStats.bestTurn.teamName,
          matchStats.bestTurn.totalWordsGuessed,
        ),
      });
    }
    if (matchStats.matchDurationMs != null) {
      cards.push({
        kind: 'duration',
        text: strings.results.stats.matchDuration(matchStats.matchDurationMs),
      });
    }
    return cards.length > 0
      ? cards
      : [{ kind: 'fallback', text: 'Гарна гра! Дякуємо, що грали разом.' }];
  }, [matchStats]);

  const totalCards = statCards.length;
  const statIndex = totalCards - statCardsRemaining;
  const currentCard = statCards[Math.min(statIndex, totalCards - 1)];

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
        <ContentColumn className="flex-1">
          <ScreenHeader title={strings.results.statisticTitle} />
          <View className="flex-1 justify-center px-6">
            <View className="rounded-3xl bg-white/80 px-8 py-6">
              <Text className="mb-4 text-center text-sm uppercase tracking-widest text-slate-400">
                {Math.min(statIndex + 1, totalCards)} / {totalCards}
              </Text>
              <Animated.View style={carouselStyle} className="items-center">
                {currentCard.kind !== 'fallback' && (
                  <View className="mb-4">
                    <StatCardIcon kind={currentCard.kind} />
                  </View>
                )}
                <AnimatedText className="text-center text-xl font-bold leading-9 text-black">
                  {currentCard.text}
                </AnimatedText>
              </Animated.View>
            </View>
          </View>
          <ScreenFooter
            label={strings.results.statNext}
            onPress={dismissStat}
            skipLabel={strings.results.statSkip}
            skipOnPress={skipToPodium}
          />
        </ContentColumn>
      </SafeAreaView>
    </ImageBackground>
  );
}
