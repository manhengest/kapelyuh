import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { strings } from '@content/strings';
import { SaveWordsModal } from '@features/game/components/Modals';
import { customHatWordTexts } from '@features/game/customHatWords';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { playEnd } from '@infrastructure/audio/sounds';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const ROUND_COLUMNS = [
  {
    key: 'elias',
    icon: require('@assets/images/icons/round-intro/elias-round-icon.png.png'),
  },
  {
    key: 'crocodile',
    icon: require('@assets/images/icons/round-intro/crocodile-round-icon.png'),
  },
  {
    key: 'association',
    icon: require('@assets/images/icons/round-intro/association-round-icon.png'),
  },
] as const;

const ROUND_ICON_STYLE = { width: 26, height: 26 } as const;

function WinnerReveal({ children }: { children: ReactNode }) {
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
  const gameState = useGameState();
  const status = gameState.status;
  const { scoreboard, winners } = useGameSelectors();
  const { abandonMatch } = useGameActions();
  const reducedMotion = useReducedMotion();
  const endSoundPlayed = useRef(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const customHatTexts = useMemo(() => customHatWordTexts(gameState), [gameState]);

  useEffect(() => {
    if (status === 'end_of_match' && !endSoundPlayed.current) {
      endSoundPlayed.current = true;
      playEnd();
    }
  }, [status]);

  const rankedRows = useMemo(() => {
    const sorted = [...scoreboard].sort((a, b) => b.total - a.total);

    return sorted.map((row) => ({
      ...row,
      place: sorted.findIndex((other) => other.total === row.total) + 1,
    }));
  }, [scoreboard]);

  const winnerTotal = rankedRows[0]?.total ?? 0;
  const winnerNames = winners.map((winner) => winner.name).join(' · ');
  /** Teams sharing the top score means nobody took the match. */
  const isDraw = winners.length > 1;
  const winnerLabel = isDraw ? strings.results.tieLabel : strings.results.winnerLabel;
  const headline = isDraw ? strings.results.friendshipWins : winnerNames;
  const isCustomHatCta = gameState.settings.wordSource === 'custom' && customHatTexts.length > 0;

  return (
    <ScreenShell
      overlay={
        !reducedMotion ? (
          <ConfettiCannon count={120} origin={{ x: 0, y: 0 }} fadeOut autoStart />
        ) : null
      }
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-32 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="results-title">{strings.results.matchComplete}</Text>
          <Text className="results-subtitle">{strings.results.congrats}</Text>
        </View>

        {winners.length > 0 ? (
          <WinnerReveal>
            <ShadowCard>
              <View
                accessible
                accessibilityRole="summary"
                accessibilityLabel={`${winnerLabel}: ${headline}${isDraw ? `, ${winnerNames}` : ''}, ${winnerTotal} ${strings.results.pointsUnit(winnerTotal)}`}
                className="results-winner-card"
              >
                {isDraw ? null : (
                  <View className="results-winner-badge">
                    <Text className="results-winner-emoji">🏆</Text>
                  </View>
                )}
                <Text className="results-winner-label">{winnerLabel}</Text>
                <Text className="results-winner-name" numberOfLines={2}>
                  {headline}
                </Text>
                {isDraw ? (
                  <Text className="results-winner-teams" numberOfLines={2}>
                    {winnerNames}
                  </Text>
                ) : null}
                <Text className="results-winner-score">{winnerTotal}</Text>
                <Text className="results-winner-score-unit">
                  {strings.results.pointsUnit(winnerTotal)}
                </Text>
              </View>
            </ShadowCard>
          </WinnerReveal>
        ) : null}

        <View className="gap-2">
          <ShadowCard>
            <View className="panel-card">
              <View className="results-table-head">
                <View className="h-7 w-7" />
                <Text className="results-table-head-team">{strings.results.tableTeam}</Text>
                {ROUND_COLUMNS.map((column) => (
                  <View key={column.key} className="results-table-col">
                    <Image
                      accessibilityLabel={`${strings.results.tableRound} ${strings.results.roundLabels[column.key]}`}
                      source={column.icon}
                      style={ROUND_ICON_STYLE}
                      resizeMode="contain"
                    />
                  </View>
                ))}
                <View className="results-table-total-col">
                  <Text accessibilityLabel={strings.results.tableTotalLabel} className="text-base">
                    {strings.results.tableTotal}
                  </Text>
                </View>
              </View>

              {rankedRows.map((row, index) => (
                <View key={row.teamId}>
                  {index > 0 ? <View className="results-table-divider" /> : null}
                  <View
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`${row.place}. ${row.name}, ${row.total} ${strings.results.pointsUnit(row.total)}`}
                    className={
                      row.place === 1
                        ? 'results-table-row results-table-row--leader'
                        : 'results-table-row'
                    }
                  >
                    <View
                      className={
                        row.place === 1
                          ? 'results-table-rank results-table-rank--leader'
                          : 'results-table-rank'
                      }
                    >
                      <Text className="results-table-rank-text">{row.place}</Text>
                    </View>
                    <Text className="results-table-team" numberOfLines={1}>
                      {row.name}
                    </Text>
                    {ROUND_COLUMNS.map((column) => (
                      <View key={column.key} className="results-table-col">
                        <Text className="results-table-score">{row.scores[column.key]}</Text>
                      </View>
                    ))}
                    <View className="results-table-total-col">
                      <Text className="results-table-total">{row.total}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ShadowCard>
          <Text className="results-legend">{strings.results.tableRoundLegend}</Text>
        </View>
      </ScrollView>
      <ScreenFooter
        label={isCustomHatCta ? strings.common.next : strings.home.newGame}
        onPress={() => {
          if (isCustomHatCta) {
            setSaveModalVisible(true);
            return;
          }
          abandonMatch();
          router.replace('/');
        }}
      />
      {saveModalVisible ? (
        <SaveWordsModal
          onAccept={() => {
            setSaveModalVisible(false);
            router.push('/game/save-words');
          }}
          onDecline={() => {
            setSaveModalVisible(false);
            abandonMatch();
            router.replace('/');
          }}
        />
      ) : null}
    </ScreenShell>
  );
}
