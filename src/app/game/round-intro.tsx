import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, View } from 'react-native';

import { strings } from '@content/strings';
import { ROUND_TYPES } from '@domain/game/types';
import { GameScreenShell } from '@features/game/components/GameScreenShell';
import { ConfirmExitModal } from '@features/game/components/Modals';
import { useGameActions, useGameSelectors, useGameState } from '@features/game/hooks';
import { playGameStart } from '@infrastructure/audio/sounds';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';
import { getHatIconStyle, getRoundIntroIconStyle, getRoundTitleStyle } from '@ui/theme/roundPalette';

const clockIcon = require('@assets/images/icons/round-intro/clock.png');
const dividerIcon = require('@assets/images/icons/round-intro/devider.png');
const roundNameBgImage = require('@assets/images/icons/round-intro/round-name-bg.png');
const starIcon = require('@assets/images/icons/round-intro/star.png');

const roundIntroIconByRound = {
  elias: require('@assets/images/icons/round-intro/elias-round-icon.png.png'),
  crocodile: require('@assets/images/icons/round-intro/crocodile-round-icon.png'),
  association: require('@assets/images/icons/round-intro/association-round-icon.png'),
} as const;

const hatIconByRound = {
  elias: require('@assets/images/icons/round-intro/hat.png'),
  crocodile: require('@assets/images/icons/round-intro/hat-crocodile.png'),
  association: require('@assets/images/icons/round-intro/hat-association.png'),
} as const;

function getRoundIntroIcon(roundType: 'elias' | 'crocodile' | 'association' | undefined) {
  return roundIntroIconByRound[roundType ?? 'elias'];
}

function getHatIcon(roundType: 'elias' | 'crocodile' | 'association' | undefined) {
  return hatIconByRound[roundType ?? 'elias'];
}

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
  const { currentRound, currentTeam, isCarryOver, upcomingTurnDurationMs } = useGameSelectors();
  const { dispatch, abandonMatch } = useGameActions();
  const state = useGameState();
  const roundIndex = state.currentRoundIndex;
  const totalRounds = ROUND_TYPES.length;
  const roundType = currentRound?.type;
  const turnDurationSec = Math.round(upcomingTurnDurationMs / 1000);
  const wordCount = state.settings.wordCount;
  const titleStyle = getRoundTitleStyle(roundType);
  const roundIntroIconStyle = getRoundIntroIconStyle(roundType);
  const hatIconStyle = getHatIconStyle(roundType);
  const gameStarted = state.turnHistory.length > 0;
  const [confirmVisible, setConfirmVisible] = useState(false);

  const onBack = () => {
    if (gameStarted) {
      setConfirmVisible(true);
      return;
    }
    dispatch({ type: 'BACK_TO_TEAMS' });
  };

  const onConfirmExit = () => {
    abandonMatch();
    router.replace('/');
  };

  return (
    <GameScreenShell roundType={roundType}>
      <ScreenHeader onBack={onBack} />

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
            source={getRoundIntroIcon(roundType)}
            style={{
              position: 'absolute',
              top: roundIntroIconStyle.top,
              left: roundIntroIconStyle.left,
              width: roundIntroIconStyle.width,
              height: roundIntroIconStyle.height,
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
                fontSize: titleStyle.fontSize,
                fontWeight: '900',
                color: titleStyle.color,
                textAlign: 'center',
                paddingHorizontal: 16,
              }}
            >
              {getRoundDisplayName(roundType)}
            </Text>
          </ImageBackground>

          {/* Hat icon overlapping the right edge */}
          <Image
            source={getHatIcon(roundType)}
            style={{
              position: 'absolute',
              right: hatIconStyle.right,
              bottom: hatIconStyle.bottom,
              width: hatIconStyle.width,
              height: hatIconStyle.height,
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
        <Text className="text-center text-6xl font-bold leading-tight text-primaryText">
          {currentTeam?.name ?? ''}
        </Text>

        {isCarryOver && currentTeam && (
          <Text className="mb-6 mt-2 text-center text-lg font-semibold text-highlightText">
            {strings.rounds.carryOverContinues(currentTeam.name)}
            {'\n'}
            {strings.rounds.carryOverTimeLeft(turnDurationSec)}
          </Text>
        )}

        {!isCarryOver && <View className="mb-10" />}

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
        onPress={() => {
          playGameStart();
          dispatch({ type: 'ROUND_INTRO_ACK' });
        }}
      />

      <ConfirmExitModal
        visible={confirmVisible}
        onConfirm={onConfirmExit}
        onCancel={() => setConfirmVisible(false)}
      />
    </GameScreenShell>
  );
}
