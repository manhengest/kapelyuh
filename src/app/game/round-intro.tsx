import { useRouter } from 'expo-router';
import { Image, ImageBackground, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { Button } from '@ui/components/Button';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

const clockIcon = require('../../../assets/images/icons/round-intro/clock.png');
const dialogIcon = require('../../../assets/images/icons/round-intro/dialog.png');
const hatIcon = require('../../../assets/images/icons/round-intro/hat.png');
const roundNameBgImage = require('../../../assets/images/icons/round-intro/round-name-bg.png');
const starIcon = require('../../../assets/images/icons/round-intro/star.png');
const mainBg = require('../../../assets/images/main-bg.png');

function getRoundDisplayName(roundType: 'elias' | 'crocodile' | 'association' | undefined) {
  switch (roundType) {
    case 'crocodile':
      return 'Крокодил';
    case 'association':
      return 'Асоціація';
    default:
      return 'Еліас';
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
  const { currentRound, currentTeam } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const state = useGameState();
  const roundIndex = state.currentRoundIndex;
  const totalRounds = state.rounds.length;
  const roundType = currentRound?.type;
  const turnDurationSec = Math.round(state.settings.turnDurationMs / 1000);
  const wordCount = state.settings.wordCount;

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          showHome
          onHomePress={() => {
            abandonMatch();
            router.replace('/');
          }}
        />

        <View className="flex-1 px-5 pt-2">
          {/* Round number badge */}
          <View className="mb-2 items-center">
            <View className="rounded-full bg-black/10 px-5 py-1.5">
              <Text className="text-sm font-semibold text-primaryText">
                {strings.rounds.roundLabel(roundIndex + 1, totalRounds)}
              </Text>
            </View>
          </View>

          {/* Round name card with floating decorations */}
          <View style={{ paddingTop: 36, paddingBottom: 24, paddingRight: 12, marginBottom: 8 }}>
            {/* Speech bubble icon floating above */}
            <Image
              source={dialogIcon}
              style={{ position: 'absolute', top: 0, left: '28%', width: 84, height: 62, zIndex: 2 }}
              resizeMode="contain"
            />

            <ImageBackground
              source={roundNameBgImage}
              style={{ width: '100%', aspectRatio: 1000 / 544, justifyContent: 'center', alignItems: 'center' }}
              imageStyle={{ borderRadius: 24 }}
              resizeMode="cover"
            >
              <Text
                style={{
                  fontSize: 56,
                  fontWeight: '800',
                  color: '#401947',
                  textAlign: 'center',
                  paddingHorizontal: 16,
                }}
              >
                {getRoundDisplayName(roundType)}
              </Text>
            </ImageBackground>

            {/* Hat icon overlapping the right edge */}
            <Image
              source={hatIcon}
              style={{ position: 'absolute', right: 0, bottom: 0, width: 120, height: 121, zIndex: 2 }}
              resizeMode="contain"
            />
          </View>

          {/* Team name */}
          <Text className="mb-2 text-center text-3xl font-bold text-primaryText">
            {currentTeam?.name ?? ''}
          </Text>

          {/* "Хід команди" badge */}
          <View className="mb-3 items-center">
            <View className="rounded-full bg-black/10 px-5 py-1.5">
              <Text className="text-sm font-semibold text-primaryText">{strings.rounds.teamTurn}</Text>
            </View>
          </View>

          {/* Hint */}
          <Text className="mb-5 px-4 text-center text-base text-primaryText">
            {getRoundHint(roundType)}
          </Text>

          {/* Info row */}
          <View className="flex-row items-center justify-center gap-6">
            <View className="flex-row items-center gap-2">
              <Image source={clockIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text className="text-sm font-semibold text-primaryText">{turnDurationSec} сек</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Image source={starIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text className="text-sm font-semibold text-primaryText">{wordCount} слів</Text>
            </View>
          </View>
        </View>

        <View className="px-5 pb-6">
          <Button label={strings.common.start} onPress={() => dispatch({ type: 'ROUND_INTRO_ACK' })} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
