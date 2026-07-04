import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { formatTimer } from '@shared/lib/format';
import { Text } from '@ui/components/Text';

type CountdownRingProps = {
  remainingMs: number;
  totalMs: number;
  textColor?: string;
  locked?: boolean;
};

function getTimerColor(remainingMs: number, locked: boolean): string {
  if (locked || remainingMs <= 5_000) return '#EF4444';
  if (remainingMs <= 15_000) return '#F59E0B';
  return '#1A1A1A';
}

export function CountdownRing({ remainingMs, locked = false }: CountdownRingProps) {
  const reducedMotion = useReducedMotion();
  const timerColor = getTimerColor(remainingMs, locked);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion || locked || remainingMs > 3_000) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.06, { duration: 350, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [locked, pulse, reducedMotion, remainingMs]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        pillStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#FFFFFF',
          borderRadius: 999,
          paddingHorizontal: 24,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
      ]}
    >
      <Text style={{ fontSize: 20 }}>⏱</Text>
      <Text style={{ color: timerColor, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {locked ? '00:00' : formatTimer(remainingMs)}
      </Text>
    </Animated.View>
  );
}
