import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { strings } from '@content/strings';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { Button } from '@ui/components/Button';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { getRoundPalette } from '@ui/theme/roundPalette';

function getForbidden(roundType: 'elias' | 'crocodile' | 'association' | undefined) {
  switch (roundType) {
    case 'crocodile':
      return strings.rounds.crocodileForbidden;
    case 'association':
      return strings.rounds.associationForbidden;
    default:
      return strings.rounds.eliasForbidden;
  }
}

function getRoundName(roundType: 'elias' | 'crocodile' | 'association' | undefined) {
  switch (roundType) {
    case 'crocodile':
      return strings.rounds.crocodile;
    case 'association':
      return strings.rounds.association;
    default:
      return strings.rounds.elias;
  }
}

function getRoundHint(roundType: 'elias' | 'crocodile' | 'association' | undefined) {
  switch (roundType) {
    case 'crocodile':
      return strings.rounds.crocodileHint;
    case 'association':
      return strings.rounds.associationHint;
    default:
      return strings.rounds.eliasHint;
  }
}

export default function RoundIntroScreen() {
  const router = useRouter();
  const { currentRound } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const roundIndex = useGameState().currentRoundIndex;
  const roundType = currentRound?.type;
  const palette = getRoundPalette(roundType);

  return (
    <GameScreenShell roundType={roundType}>
      <ScreenHeader
        showHome
        onHomePress={() => {
          abandonMatch();
          router.replace('/');
        }}
        textColor={palette.text}
      />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
        <View className="mb-4 self-center rounded-full bg-black/10 px-4 py-1">
          <Text style={{ color: palette.text }} className="text-sm font-semibold">
            {strings.rounds.roundLabel(roundIndex + 1)}
          </Text>
        </View>
        <Text style={{ color: palette.text }} className="mb-4 text-center text-base">
          {getRoundHint(roundType)}
        </Text>
        <View
          className="mb-6 min-h-[180px] items-center justify-center rounded-3xl px-4 py-8"
          style={{ backgroundColor: palette.card }}
        >
          <Text style={{ color: palette.text }} className="text-center text-5xl font-bold">
            {getRoundName(roundType)}
          </Text>
        </View>
        <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-red-600">
          {strings.rounds.forbidden}
        </Text>
        {getForbidden(roundType).map((rule) => (
          <Text key={rule} style={{ color: palette.text }} className="mb-2 text-base">
            × {rule}
          </Text>
        ))}
      </ScrollView>
      <View className="px-5 pb-6">
        <Button label={strings.common.next} onPress={() => dispatch({ type: 'ROUND_INTRO_ACK' })} />
      </View>
    </GameScreenShell>
  );
}