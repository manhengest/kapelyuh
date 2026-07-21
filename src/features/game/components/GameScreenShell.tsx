import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ImageBackground, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoundType } from '@domain/game/types';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { ContentColumn } from '@ui/components/ContentColumn';
import { getRoundPalette } from '@ui/theme/roundPalette';

const mainBg = require('@assets/images/main-bg.png');

type GameScreenShellProps = ViewProps & {
  roundType?: RoundType;
  children: ReactNode;
};

export function GameScreenShell({ roundType, children, className = '', ...props }: GameScreenShellProps) {
  const palette = getRoundPalette(roundType);
  const reducedMotion = useReducedMotion();
  const tintOpacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      tintOpacity.value = roundType === 'elias' || roundType == null ? 0 : 0.35;
      return;
    }
    tintOpacity.value = withTiming(roundType === 'elias' || roundType == null ? 0 : 0.35, { duration: 400 });
  }, [tintOpacity, reducedMotion, roundType]);

  const tintStyle = useAnimatedStyle(() => ({
    ...{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: palette.bg,
    opacity: tintOpacity.value,
  }));

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <Animated.View style={tintStyle} />
      <SafeAreaView className={`flex-1 ${className}`} {...props}>
        <ContentColumn className="flex-1">{children}</ContentColumn>
      </SafeAreaView>
    </ImageBackground>
  );
}
