
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { strings } from '@content/strings';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { PenaltyModal } from '@features/game/components/Modals';
import {
  useGameActions,
  useGameSelectors,
  useReviewWords,
  useTurnNetScore,
} from '@features/game/hooks';
import { triggerHaptic } from '@infrastructure/haptics';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { getRoundPalette } from '@ui/theme/roundPalette';

export default function ReviewScreen() {
  const { currentTeam, currentRound, reviewBanner, reviewCta } = useGameSelectors();
  const { dispatch } = useGameActions();
  const reviewWords = useReviewWords();
  const netScore = useTurnNetScore();
  const palette = getRoundPalette(currentRound?.type);
  const reducedMotion = useReducedMotion();

  const [overrides, setOverrides] = useState<Record<string, 'guessed' | 'skipped'>>({});
  const [penaltyVisible, setPenaltyVisible] = useState(false);
  const bannerOffset = useSharedValue(reducedMotion ? 0 : -80);

  useEffect(() => {
    if (reducedMotion) {
      bannerOffset.value = 0;
      return;
    }
    bannerOffset.value = -80;
    bannerOffset.value = withTiming(0, { duration: 250 });
  }, [bannerOffset, reducedMotion, reviewBanner]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerOffset.value }],
  }));

  const words = useMemo(() => {
    return reviewWords.map((entry) => {
      const original =
        entry.outcome === 'guessed' || entry.outcome === 'skipped' ? entry.outcome : 'skipped';
      const checked = (overrides[entry.wordId] ?? original) === 'guessed';
      return { ...entry, checked };
    });
  }, [overrides, reviewWords]);

  const toggleWord = (wordId: string, checked: boolean) => {
    void triggerHaptic('light');
    setOverrides((current) => ({
      ...current,
      [wordId]: checked ? 'guessed' : 'skipped',
    }));
  };

  const onContinue = () => {
    dispatch({ type: 'REVIEW_SUBMITTED', overrides });
    if (reviewCta === 'next_turn') {
      dispatch({ type: 'NEXT_TURN' });
      return;
    }
    if (reviewCta === 'next_round') {
      dispatch({ type: 'NEXT_ROUND' });
      return;
    }
    dispatch({ type: 'OPEN_STAT_CAROUSEL' });
  };

  let ctaLabel: string = strings.review.nextTeam;
  if (reviewCta === 'next_round') {
    ctaLabel = strings.review.nextRound;
  } else if (reviewCta === 'match_results') {
    ctaLabel = strings.review.matchResults;
  }

  const bannerText =
    reviewBanner === 'hat_empty' ? strings.review.hatEmpty : strings.review.timeUp;
  const bannerColor = reviewBanner === 'hat_empty' ? '#E8F36C' : '#F4A6C8';

  return (
    <GameScreenShell roundType={currentRound?.type}>
      <Animated.View style={[{ backgroundColor: bannerColor }, bannerStyle]} className="px-4 py-3">
        <Text className="text-center text-base font-bold text-slate-900">{bannerText}</Text>
      </Animated.View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="py-6">
        <Text style={{ color: palette.text }} className="mb-1 text-center text-xl font-semibold">
          {currentTeam?.name}
        </Text>
        <Text style={{ color: palette.text }} className="mb-1 text-center text-base">
          {strings.review.pointsAwarded}
        </Text>
        <Text style={{ color: palette.text }} className="mb-4 text-center text-5xl font-bold">
          {netScore}
        </Text>

        {words.length === 0 ? (
          <Text style={{ color: palette.text }} className="mb-4 text-center text-base">
            {strings.review.emptyTurn}
          </Text>
        ) : (
          <>
            <Pressable onPress={() => setPenaltyVisible(true)} className="mb-4">
              <Text className="text-sm text-blue-700">{strings.review.penaltyInfo}</Text>
            </Pressable>
            <View className="gap-2">
              {words
                .filter((entry) => entry.outcome === 'guessed' || entry.outcome === 'skipped')
                .map((entry) => (
                  <Pressable
                    key={entry.wordId}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: entry.checked }}
                    onPress={() => toggleWord(entry.wordId, !entry.checked)}
                    className="flex-row items-center gap-3 rounded-xl bg-white/70 px-4 py-3"
                  >
                    <View
                      className={`review-checkbox ${entry.checked ? 'review-checkbox--checked' : ''}`}
                    >
                      {entry.checked ? <Text className="text-white">✓</Text> : null}
                    </View>
                    <Text className="flex-1 text-base text-slate-900">{entry.text}</Text>
                  </Pressable>
                ))}
            </View>
          </>
        )}
      </ScrollView>

      <View className="px-5 pb-6">
        <Button label={ctaLabel} onPress={onContinue} />
      </View>

      <PenaltyModal visible={penaltyVisible} onClose={() => setPenaltyVisible(false)} />
    </GameScreenShell>
  );
}
