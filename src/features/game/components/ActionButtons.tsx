import { useEffect } from 'react';
import { Image, Pressable, View } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { AnimatedText, Text } from '@ui/components/Text';

const guessedIcon = require('../../../../assets/images/icons/turn/guessed.png');
const skipIcon = require('../../../../assets/images/icons/turn/skip.png');

type ActionButtonsProps = {
  onGuess: () => void;
  onSkip: () => void;
  guessCount: number;
  skipCount: number;
  disabled?: boolean;
};

function BounceCounter({ value }: { value: number }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withSequence(
      withTiming(1.25, { duration: 40 }),
      withTiming(1, { duration: 40 }),
    );
  }, [reducedMotion, scale, value]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedText style={style} className="text-sm font-bold text-[#1A1A1A]">
      {value}
    </AnimatedText>
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
    <View className="flex-row items-end justify-center gap-6 px-8">
      {/* Guess — left, yellow */}
      <View className="items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Відгадано"
          disabled={disabled}
          onPress={onGuess}
          className="h-28 w-28 items-center justify-center rounded-3xl bg-[#FDC82B]"
          style={{ opacity: disabled ? 0.3 : 1 }}
        >
          <Image source={guessedIcon} style={{ width: 60, height: 60 }} resizeMode="contain" />
        </Pressable>
        <View className="flex-row items-center gap-1">
          <Text className="text-base font-semibold text-[#1A1A1A]">Відгадано</Text>
          <BounceCounter value={guessCount} />
        </View>
      </View>

      {/* Skip — right, white outlined */}
      <View className="items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Пропустити"
          disabled={disabled}
          onPress={onSkip}
          className="h-28 w-28 items-center justify-center rounded-3xl bg-white"
          style={{
            opacity: disabled ? 0.3 : 1,
            borderWidth: 2,
            borderColor: '#E5E7EB',
          }}
        >
          <Image source={skipIcon} style={{ width: 60, height: 60 }} resizeMode="contain" />
        </Pressable>
        <View className="flex-row items-center gap-1">
          <Text className="text-base font-semibold text-[#1A1A1A]">Пропустити</Text>
          <BounceCounter value={skipCount} />
        </View>
      </View>
    </View>
  );
}
