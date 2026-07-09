import { useRouter } from 'expo-router';
import { Image, ImageBackground, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { ROUND_TYPES } from '@domain/game/types';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

const clockIcon = require('@assets/images/icons/round-intro/clock.png');
const dividerIcon = require('@assets/images/icons/round-intro/devider.png');
const dialogIcon = require('@assets/images/icons/round-intro/dialog.png');
const hatIcon = require('@assets/images/icons/round-intro/hat.png');
const roundNameBgImage = require('@assets/images/icons/round-intro/round-name-bg.png');
const starIcon = require('@assets/images/icons/round-intro/star.png');
const mainBg = require('@assets/images/main-bg.png');

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
  const { dispatch } = useGameActions();
  const state = useGameState();
  const roundIndex = state.currentRoundIndex;
  const totalRounds = ROUND_TYPES.length;
  const roundType = currentRound?.type;
  const turnDurationSec = Math.round(state.settings.turnDurationMs / 1000);
  const wordCount = state.settings.wordCount;

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader
          onBack={() => {
            dispatch({ type: 'BACK_TO_TEAMS' });
            router.replace('/game/teams');
          }}
        />

        <View className="flex-1 px-5 pt-2">
          {/* Round number badge */}
          <View className="mb-10 items-center">
            <View>
              <Text className="text-3xl font-bold text-highlightText">
                {strings.rounds.roundLabel(roundIndex + 1, totalRounds)}
              </Text>
            </View>
          </View>

          {/* Round name card with floating decorations */}
          <View style={{ paddingTop: 36, paddingBottom: 24, paddingRight: 12, marginBottom: 8 }}>
            {/* Speech bubble icon floating above */}
            <Image
              source={dialogIcon}
              style={{
                position: 'absolute',
                top: 20,
                left: '60%',
                width: 84,
                height: 62,
                zIndex: 2,
              }}
              resizeMode="contain"
            />

            <ImageBackground
              source={roundNameBgImage}
              style={{
                width: '100%',
                aspectRatio: 1000 / 544,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              imageStyle={{ borderRadius: 24 }}
              resizeMode="cover"
            >
              <Text
                style={{
                  fontSize: 90,
                  fontWeight: '900',
                  color: '#FB6694',
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
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 120,
                height: 121,
                zIndex: 2,
              }}
              resizeMode="contain"
            />
          </View>

          {/* "Хід команди" badge */}
          <View className="mb-3 items-center">
            <View>
              <Text className="text-2xl font-bold text-highlightText">
                {strings.rounds.teamTurn}
              </Text>
            </View>
          </View>

          {/* Team name */}
          <Text className="mb-10 text-center text-6xl font-bold leading-tight text-primaryText">
            {currentTeam?.name ?? ''}
          </Text>

          {/* Info row */}
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 5, height: 5 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 10,
            }}
            className="flex-row items-center justify-center gap-6 self-center rounded-full bg-[#f6efe8] px-6 py-2.5"
          >
            <View className="flex-row items-center gap-2">
              <Image source={clockIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text className="text-lg font-bold text-primaryText">{turnDurationSec} сек</Text>
            </View>
            <Image source={dividerIcon} style={{ width: 7, height: 24 }} resizeMode="contain" />
            <View className="flex-row items-center gap-2">
              <Image source={starIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text className="text-lg font-bold text-primaryText">{wordCount} слів</Text>
            </View>
          </View>
        </View>

        <ScreenFooter
          hint={getRoundHint(roundType)}
          label={strings.common.start}
          onPress={() => dispatch({ type: 'ROUND_INTRO_ACK' })}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}
