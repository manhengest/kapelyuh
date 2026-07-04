import { useRouter } from 'expo-router';
import { Image, ImageBackground, Pressable, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useGameStore } from '@features/game/store';
import { Text } from '@ui/components/Text';

const aboutIcon = require('../../assets/images/icons/landing/about.png');
const chevronIcon = require('../../assets/images/icons/landing/chevron-arrow-right.png');
const hatIcon = require('../../assets/images/icons/landing/hat.png');
const heartSubtitleIcon = require('../../assets/images/icons/landing/heart-subtitle.png');
const howToPlayIcon = require('../../assets/images/icons/landing/how-to-play.png');
const newGameFragmentIcon = require('../../assets/images/icons/landing/new-game-fragment.png');
const newGameIcon = require('../../assets/images/icons/landing/new-game.png');
const settingsIcon = require('../../assets/images/icons/landing/settings.png');
const textIcon = require('../../assets/images/icons/landing/text.png');
const mainBg = require('../../assets/images/main-bg.png');

type LandingMenuButtonProps = {
  label: string;
  icon: ImageSourcePropType;
  onPress: () => void;
};

function LandingMenuButton({ label, icon, onPress }: Readonly<LandingMenuButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="landing-menu-btn"
      style={{
        shadowColor: '#f2f2f2',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 0,
        elevation: 10, // Android
      }}
    >
      <Image
        source={icon}
        style={{ width: 40, height: 40, position: 'absolute', left: 20, top: 10 }}
        resizeMode="contain"
      />
      <Text className="landing-menu-btn-text">{label}</Text>
      <Image
        source={chevronIcon}
        style={{ width: 12, height: 20, position: 'absolute', right: 24, top: 20 }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useGameStore((store) => store.dispatch);

  const startNewGame = () => {
    dispatch({ type: 'START_SETUP' });
    router.push('/game/setup');
  };

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 justify-between">
        <View className="items-center px-6 pt-16">
          <Image
            source={hatIcon}
            accessibilityRole="image"
            accessibilityLabel={strings.appName}
            style={{ width: 240, height: 132 }}
            resizeMode="contain"
          />
          <Image
            source={textIcon}
            accessibilityRole="image"
            accessibilityLabel={strings.appName}
            style={{ width: 320, height: 96, marginTop: 4 }}
            resizeMode="contain"
          />
          <View className="mt-2 flex-row items-center justify-center gap-2">
            <Text className="text-lg font-bold text-[#3D2B56]">{strings.home.tagline}</Text>
            <Image
              source={heartSubtitleIcon}
              accessibilityRole="image"
              accessibilityLabel=""
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <View className="gap-5 px-14 pb-20">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.home.newGame}
            onPress={startNewGame}
            style={{
              shadowColor: '#FEA41E',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.5,
              shadowRadius: 0,
              elevation: 10, // Android
            }}
            className="landing-new-game-btn"
          >
            <Image
              source={newGameIcon}
              style={{ width: 48, height: 48, position: 'absolute', left: 24, top: 17 }}
              resizeMode="contain"
            />
            <Text className="landing-new-game-btn-text">{strings.home.newGame}</Text>
            <Image
              source={newGameFragmentIcon}
              style={{ width: 32, height: 42, position: 'absolute', right: 24, top: 12 }}
              resizeMode="contain"
            />
          </Pressable>

          <LandingMenuButton
            label={strings.home.rules}
            icon={howToPlayIcon}
            onPress={() => router.push('/rules')}
          />
          <LandingMenuButton
            label={strings.home.settings}
            icon={settingsIcon}
            onPress={() => router.push('/settings')}
          />
          <LandingMenuButton
            label={strings.home.about}
            icon={aboutIcon}
            onPress={() => router.push('/about')}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
