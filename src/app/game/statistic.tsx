import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { strings } from '@content/strings';
import { formatGuessDurationSeconds } from '@domain/game/selectors';
import type { RecapCard } from '@domain/game/types';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const RECAP_EMOJI: Record<RecapCard['kind'], string> = {
  close_game: '🔥',
  blowout: '😎',
  fastest: '🧠',
  hardest: '🥵',
  slowest: '🫠',
  best_turn: '⚡️',
  summary: '🏆',
};

function recapAccessibilityLabel(card: RecapCard): string {
  const copy = strings.results.recap;
  switch (card.kind) {
    case 'close_game':
      return [copy.closeTitle, String(card.gap), copy.scoreGapCaption(card.gap)].join('. ');
    case 'blowout':
      return [copy.blowoutTitle, String(card.gap), copy.scoreGapCaption(card.gap)].join('. ');
    case 'fastest': {
      const seconds = formatGuessDurationSeconds(card.durationMs);
      return [
        copy.fastestTitle,
        copy.onWord,
        copy.quotedWord(card.wordText),
        copy.spent,
        String(seconds),
        copy.secondsUnit(seconds),
        copy.bestTurnTeam(card.teamName),
      ].join('. ');
    }
    case 'hardest':
      return [
        copy.hardestTitle,
        copy.quotedWord(card.wordText),
        copy.hardestSkips(card.skipsBeforeFirst),
        copy.hardestAttempt(card.attemptIndex),
      ].join('. ');
    case 'slowest': {
      const seconds = formatGuessDurationSeconds(card.durationMs);
      return [
        copy.slowestTitle,
        copy.onWord,
        copy.quotedWord(card.wordText),
        copy.spent,
        String(seconds),
        copy.secondsUnit(seconds),
        copy.bestTurnTeam(card.teamName),
      ].join('. ');
    }
    case 'best_turn':
      return [
        copy.bestTurnTitle,
        String(card.totalWordsGuessed),
        copy.bestTurnCaption(card.totalWordsGuessed),
        copy.bestTurnTeam(card.teamName),
      ].join('. ');
    case 'summary':
      return [
        copy.summaryTitle,
        `${copy.durationLabel}: ${copy.durationValue(card.durationMs ?? 0)}`,
        `${copy.skippedLabel}: ${copy.skippedValue(card.skippedCount)}`,
        `${copy.turnsLabel}: ${copy.turnsValue(card.turnCount)}`,
      ].join('. ');
  }
}

function RecapCardBody({ card }: { card: RecapCard }) {
  const copy = strings.results.recap;
  const emoji = RECAP_EMOJI[card.kind];

  switch (card.kind) {
    case 'summary': {
      const rows = [
        { label: copy.durationLabel, value: copy.durationValue(card.durationMs ?? 0) },
        { label: copy.skippedLabel, value: copy.skippedValue(card.skippedCount) },
        { label: copy.turnsLabel, value: copy.turnsValue(card.turnCount) },
      ];
      const lastIndex = rows.length - 1;
      return (
        <>
          <Text className="recap-summary-title">{copy.summaryTitle}</Text>
          {rows.map((row, index) => (
            <View key={row.label}>
              {index > 0 ? <View className="recap-summary-divider" /> : null}
              <View
                className={
                  index === lastIndex
                    ? 'recap-summary-row recap-summary-row--last'
                    : 'recap-summary-row'
                }
              >
                <Text className="recap-summary-label">{row.label}</Text>
                <Text className="recap-summary-value">{row.value}</Text>
              </View>
            </View>
          ))}
        </>
      );
    }
    case 'close_game':
      return (
        <>
          <Text className="recap-emoji">{emoji}</Text>
          <Text className="recap-kicker">{copy.closeTitle}</Text>
          <View className="recap-hero-wrap">
            <Text className="recap-hero" numberOfLines={1}>
              {card.gap}
            </Text>
          </View>
          <Text className="recap-caption">{copy.scoreGapCaption(card.gap)}</Text>
        </>
      );
    case 'blowout':
      return (
        <>
          <Text className="recap-emoji">{emoji}</Text>
          <Text className="recap-kicker">{copy.blowoutTitle}</Text>
          <View className="recap-hero-wrap">
            <Text className="recap-hero" numberOfLines={1}>
              {card.gap}
            </Text>
          </View>
          <Text className="recap-caption">{copy.scoreGapCaption(card.gap)}</Text>
        </>
      );
    case 'fastest': {
      const seconds = formatGuessDurationSeconds(card.durationMs);
      return (
        <>
          <Text className="recap-emoji">{emoji}</Text>
          <Text className="recap-kicker">{copy.fastestTitle}</Text>
          <Text className="recap-label">{copy.onWord}</Text>
          <Text className="recap-word" numberOfLines={2} adjustsFontSizeToFit>
            {copy.quotedWord(card.wordText)}
          </Text>
          <Text className="recap-label">{copy.spent}</Text>
          <View className="recap-hero-wrap">
            <Text className="recap-hero" numberOfLines={1}>
              {seconds}
            </Text>
          </View>
          <Text className="recap-caption">{copy.secondsUnit(seconds)}</Text>
          <Text className="recap-detail">{copy.bestTurnTeam(card.teamName)}</Text>
        </>
      );
    }
    case 'hardest':
      return (
        <>
          <Text className="recap-emoji">{emoji}</Text>
          <Text className="recap-kicker">{copy.hardestTitle}</Text>
          <Text className="recap-hero-word" numberOfLines={2} adjustsFontSizeToFit>
            {copy.quotedWord(card.wordText)}
          </Text>
          <Text className="recap-detail">{copy.hardestSkips(card.skipsBeforeFirst)}</Text>
          <Text className="recap-detail">{copy.hardestAttempt(card.attemptIndex)}</Text>
        </>
      );
    case 'slowest': {
      const seconds = formatGuessDurationSeconds(card.durationMs);
      return (
        <>
          <Text className="recap-emoji">{emoji}</Text>
          <Text className="recap-kicker">{copy.slowestTitle}</Text>
          <Text className="recap-label">{copy.onWord}</Text>
          <Text className="recap-word" numberOfLines={2} adjustsFontSizeToFit>
            {copy.quotedWord(card.wordText)}
          </Text>
          <Text className="recap-label">{copy.spent}</Text>
          <View className="recap-hero-wrap">
            <Text className="recap-hero" numberOfLines={1}>
              {seconds}
            </Text>
          </View>
          <Text className="recap-caption">{copy.secondsUnit(seconds)}</Text>
          <Text className="recap-detail">{copy.bestTurnTeam(card.teamName)}</Text>
        </>
      );
    }
    case 'best_turn':
      return (
        <>
          <Text className="recap-emoji">{emoji}</Text>
          <Text className="recap-kicker">{copy.bestTurnTitle}</Text>
          <View className="recap-hero-wrap">
            <Text className="recap-hero" numberOfLines={1}>
              {card.totalWordsGuessed}
            </Text>
          </View>
          <Text className="recap-caption">{copy.bestTurnCaption(card.totalWordsGuessed)}</Text>
          <Text className="recap-detail">{copy.bestTurnTeam(card.teamName)}</Text>
        </>
      );
  }
}

export default function StatisticScreen() {
  const statCardsRemaining = useGameState().statCardsRemaining;
  const { recapCards } = useGameSelectors();
  const { dispatch } = useGameActions();
  const cardOpacity = useSharedValue(1);

  const totalCards = recapCards.length;
  const recapIndex = totalCards - statCardsRemaining;
  const currentIndex = Math.min(Math.max(recapIndex, 0), Math.max(totalCards - 1, 0));
  const currentCard = recapCards[currentIndex];

  const dismissRecap = () => {
    cardOpacity.value = withTiming(0.95, { duration: 90 });
    cardOpacity.value = withTiming(1, { duration: 90 });
    dispatch({ type: 'DISMISS_STAT_CAROUSEL' });
  };

  const skipToPodium = () => {
    dispatch({ type: 'SKIP_STAT_CAROUSEL' });
  };

  const carouselStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardOpacity.value }],
  }));

  return (
    <ScreenShell>
      <ScreenHeader title={strings.results.recap.screenTitle} />
      <View className="flex-1 px-5 pt-10">
        <Animated.View
          style={carouselStyle}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={currentCard ? recapAccessibilityLabel(currentCard) : undefined}
          accessibilityHint={
            totalCards > 1
              ? strings.results.recap.cardProgress(currentIndex + 1, totalCards)
              : undefined
          }
        >
          <ShadowCard>
            <View
              className={
                currentCard?.kind === 'summary' ? 'recap-card recap-card--summary' : 'recap-card'
              }
            >
              {currentCard ? <RecapCardBody card={currentCard} /> : null}
            </View>
          </ShadowCard>
        </Animated.View>
        {totalCards > 1 ? (
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel={strings.results.recap.cardProgress(currentIndex + 1, totalCards)}
            className="recap-dots"
          >
            {recapCards.map((card, index) => (
              <View
                key={card.kind}
                className={index === currentIndex ? 'recap-dot--active' : 'recap-dot'}
              />
            ))}
          </View>
        ) : null}
      </View>
      <ScreenFooter
        label={strings.results.recap.next}
        onPress={dismissRecap}
        skipLabel={strings.results.recap.skip}
        skipOnPress={skipToPodium}
      />
    </ScreenShell>
  );
}
