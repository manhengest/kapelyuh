import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { formatTimer } from '@shared/lib/format';

type CountdownRingProps = {
  remainingMs: number;
  totalMs: number;
  textColor?: string;
  locked?: boolean;
};

const SIZE = 176;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRingColor(remainingMs: number, locked: boolean, textColor: string): string {
  if (locked || remainingMs <= 5_000) {
    return '#EF4444';
  }
  if (remainingMs <= 15_000) {
    return '#F59E0B';
  }
  return textColor;
}

export function CountdownRing({
  remainingMs,
  totalMs,
  textColor = '#1A1A1A',
  locked = false,
}: CountdownRingProps) {
  const reducedMotion = useReducedMotion();
  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  const ringColor = getRingColor(remainingMs, locked, textColor);
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion || locked || remainingMs > 3_000) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.12, { duration: 350, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [locked, pulse, reducedMotion, remainingMs]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: locked || remainingMs > 3_000 ? 0 : 1,
  }));

  return (
    <View className="items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={ringColor}
          strokeWidth={STROKE}
          fill="none"
          opacity={0.2}
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={ringColor}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <Text style={{ color: textColor }} className="text-4xl font-bold tabular-nums">
        {locked ? '00:00' : formatTimer(remainingMs)}
      </Text>
      <Animated.View
        style={[
          dotStyle,
          {
            position: 'absolute',
            top: STROKE / 2,
            left: SIZE / 2 - 6,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: ringColor,
          },
        ]}
      />
    </View>
  );
}
