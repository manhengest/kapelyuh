
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';


import { strings } from '@content/strings';
import { applyReviewOverrides, computeTurnScore } from '@domain/game/scoring';
import { selectReviewCta } from '@domain/game/selectors';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { ConfirmExitModal } from '@features/game/components/Modals';
import {
  useGameActions,
  useGameSelectors,
  useGameState,
  useReviewWords,
} from '@features/game/hooks';
import { triggerHaptic } from '@infrastructure/haptics';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';
import { getRoundPalette } from '@ui/theme/roundPalette';

export default function ReviewScreen() {
  const { currentTeam, currentRound, isHatEmpty } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const reviewWords = useReviewWords();
  const gameState = useGameState();
  const palette = getRoundPalette(currentRound?.type);
  const router = useRouter();

  const [overrides, setOverrides] = useState<Record<string, 'guessed' | 'skipped'>>({});

  const netScore = useMemo(() => {
    const turn = gameState.turn;
    if (!turn) return 0;
    const skipPenalty = gameState.settings.skipPenalty;
    const base = computeTurnScore(turn.events, skipPenalty);
    const delta = applyReviewOverrides(turn.events, overrides, skipPenalty);
    const raw = base + delta;
    // With skip penalty, turn net can go negative; display never drops below 0.
    return skipPenalty ? Math.max(0, raw) : raw;
  }, [gameState.turn, gameState.settings.skipPenalty, overrides]);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const words = useMemo(() => {
    return reviewWords.map((entry) => {
      const checked = (overrides[entry.wordId] ?? entry.outcome) === 'guessed';
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

  const returnsWords = useMemo(
    () =>
      reviewWords.some(
        (entry) => entry.outcome === 'guessed' && overrides[entry.wordId] === 'skipped',
      ),
    [overrides, reviewWords],
  );

  const effectivelyEmpty = isHatEmpty && !returnsWords;
  const effectiveCta = !effectivelyEmpty
    ? 'next_turn'
    : gameState.currentRoundIndex < 2
      ? 'next_round'
      : 'match_results';
  const effectiveBanner = effectivelyEmpty ? 'hat_empty' : 'time_up';

  const onContinue = () => {
    const nextState = dispatch({ type: 'REVIEW_SUBMITTED', overrides });
    const cta = selectReviewCta(nextState);
    if (cta === 'next_turn') {
      dispatch({ type: 'NEXT_TURN' });
      return;
    }
    if (cta === 'next_round') {
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
  if (effectiveCta === 'next_round') {
    ctaLabel = strings.review.nextRound;
  } else if (effectiveCta === 'match_results') {
    ctaLabel = strings.review.matchResults;
  }

  const bannerText =
    effectiveBanner === 'hat_empty' ? strings.review.hatEmpty : strings.review.timeUp;

  return (
    <GameScreenShell roundType={currentRound?.type}>
      <ScreenHeader title={bannerText} onBack={() => setConfirmVisible(true)} />

      <View className="px-5 pt-6">
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
      </View>

      <ScrollView className="flex-1 px-5 mb-4" contentContainerClassName="pb-6">
        {words.length === 0 ? (
          <Text style={{ color: palette.text }} className="mb-4 text-center text-base">
            {strings.review.emptyTurn}
          </Text>
        ) : (
          <View className="gap-2">
            {words.map((entry) => (
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
                <Text className="flex-1 text-xl font-semibold text-primaryText">{entry.text}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmExitModal
        visible={confirmVisible}
        onConfirm={onConfirmExit}
        onCancel={() => setConfirmVisible(false)}
      />

      <ScreenFooter label={ctaLabel} onPress={onContinue} />
    </GameScreenShell>
  );
}
