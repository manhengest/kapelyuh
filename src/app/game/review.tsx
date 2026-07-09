
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';


import { strings } from '@content/strings';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { ConfirmExitModal, PenaltyModal } from '@features/game/components/Modals';
import {
  useGameActions,
  useGameSelectors,
  useReviewWords,
  useTurnNetScore,
} from '@features/game/hooks';
import { triggerHaptic } from '@infrastructure/haptics';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';
import { getRoundPalette } from '@ui/theme/roundPalette';

export default function ReviewScreen() {
  const { currentTeam, currentRound, reviewBanner, reviewCta } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const reviewWords = useReviewWords();
  const netScore = useTurnNetScore();
  const palette = getRoundPalette(currentRound?.type);
  const router = useRouter();

  const [overrides, setOverrides] = useState<Record<string, 'guessed' | 'skipped'>>({});
  const [penaltyVisible, setPenaltyVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

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

  const onConfirmExit = () => {
    abandonMatch();
    router.replace('/');
  };

  let ctaLabel: string = strings.review.nextTeam;
  if (reviewCta === 'next_round') {
    ctaLabel = strings.review.nextRound;
  } else if (reviewCta === 'match_results') {
    ctaLabel = strings.review.matchResults;
  }

  const bannerText =
    reviewBanner === 'hat_empty' ? strings.review.hatEmpty : strings.review.timeUp;

  return (
    <GameScreenShell roundType={currentRound?.type}>
      <ScreenHeader title={bannerText} onBack={() => setConfirmVisible(true)} />

      <ScrollView className="flex-1 px-5" contentContainerClassName="py-6">
        <Text style={{ color: palette.text }} className="mb-1 text-center text-2xl font-semibold">
          {currentTeam?.name}
        </Text>
        <Text style={{ color: palette.text }} className="mb-1 text-center text-base">
          {strings.review.pointsAwarded}
        </Text>
        <Text
          style={{ color: palette.text }}
          className="mb-4 text-center text-6xl font-bold leading-normal"
        >
          {netScore}
        </Text>

        {words.length === 0 ? (
          <Text style={{ color: palette.text }} className="mb-4 text-center text-base">
            {strings.review.emptyTurn}
          </Text>
        ) : (
          <>
            <Pressable onPress={() => setPenaltyVisible(true)} className="mb-4">
              <Text className="text-center text-base text-primaryText">
                {strings.review.penaltyInfo}
              </Text>
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
                    <Text className="flex-1 text-xl font-semibold text-primaryText">
                      {entry.text}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </>
        )}
      </ScrollView>

      <PenaltyModal visible={penaltyVisible} onClose={() => setPenaltyVisible(false)} />
      <ConfirmExitModal
        visible={confirmVisible}
        onConfirm={onConfirmExit}
        onCancel={() => setConfirmVisible(false)}
      />

      <ScreenFooter label={ctaLabel} onPress={onContinue} />
    </GameScreenShell>
  );
}
