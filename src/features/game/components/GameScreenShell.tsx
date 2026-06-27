import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoundType } from '@domain/game/types';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { getRoundPalette } from '@ui/theme/roundPalette';

type GameScreenShellProps = ViewProps & {
  roundType?: RoundType;
  children: ReactNode;
};

export function GameScreenShell({ roundType, children, className = '', ...props }: GameScreenShellProps) {
  const palette = getRoundPalette(roundType);
  const reducedMotion = useReducedMotion();
  const bgProgress = useSharedValue(0);
  const targetColor = palette.bg;

  useEffect(() => {
    if (reducedMotion) {
      bgProgress.value = 1;
      return;
    }
    bgProgress.value = 0;
    bgProgress.value = withTiming(1, { duration: 400 });
  }, [bgProgress, reducedMotion, targetColor]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: targetColor,
    opacity: reducedMotion ? 1 : 0.85 + bgProgress.value * 0.15,
  }));

  return (
    <SafeAreaView className={`flex-1 ${className}`} {...props}>
      <Animated.View className="flex-1" style={animatedStyle}>
        <View className="flex-1">{children}</View>
      </Animated.View>
    </SafeAreaView>
  );
}
