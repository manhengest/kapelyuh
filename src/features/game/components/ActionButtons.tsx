import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@shared/hooks/useReducedMotion';

type ActionButtonsProps = {
  onGuess: () => void;
  onSkip: () => void;
  guessCount: number;
  skipCount: number;
  disabled?: boolean;
};

function BounceCounter({ value, className }: { value: number; className: string }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    scale.value = withSequence(
      withTiming(1.2, { duration: 40 }),
      withTiming(1, { duration: 40 }),
    );
  }, [reducedMotion, scale, value]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={style} className={className}>
      {value}
    </Animated.Text>
  );
}

export function ActionButtons({
  onGuess,
  onSkip,
  guessCount,
  skipCount,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <View className="flex-row items-end justify-between px-8">
      <View className="items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Пропустити"
          disabled={disabled}
          onPress={onSkip}
          className="h-20 w-20 items-center justify-center rounded-full bg-red-500"
          style={{ opacity: disabled ? 0.3 : 1 }}
        >
          <Text className="text-3xl font-bold text-white">×</Text>
        </Pressable>
        <BounceCounter value={skipCount} className="text-base font-semibold text-slate-800" />
      </View>

      <View className="items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Вгадав"
          disabled={disabled}
          onPress={onGuess}
          className="h-20 w-20 items-center justify-center rounded-full bg-green-500"
          style={{ opacity: disabled ? 0.3 : 1 }}
        >
          <Text className="text-3xl font-bold text-white">✓</Text>
        </Pressable>
        <BounceCounter value={guessCount} className="text-base font-semibold text-slate-800" />
      </View>
    </View>
  );
}
