import { useEffect, useMemo } from 'react';
import { Animated, Text, View } from 'react-native';

import { useReducedMotion } from '@shared/hooks/useReducedMotion';

type WordCardProps = {
  word: string;
  backgroundColor: string;
  textColor?: string;
  label?: string;
  hideFromAccessibility?: boolean;
  feedback?: 'guess' | 'skip' | null;
};

export function WordCard({
  word,
  backgroundColor,
  textColor = '#1A1A1A',
  label,
  hideFromAccessibility = false,
  feedback = null,
}: WordCardProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useMemo(() => new Animated.Value(1), []);
  const scale = useMemo(() => new Animated.Value(1), []);
  const translateX = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.4);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    scale.setValue(1);
    translateX.setValue(0);
  }, [opacity, reducedMotion, scale, translateX, word]);

  useEffect(() => {
    if (!feedback || reducedMotion) {
      return;
    }
    if (feedback === 'guess') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      return;
    }
    Animated.sequence([
      Animated.timing(translateX, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [feedback, reducedMotion, scale, translateX]);

  return (
    <View className="w-full items-center gap-2 px-4">
      {label ? (
        <Text style={{ color: textColor }} className="text-sm font-bold uppercase tracking-widest">
          {label}
        </Text>
      ) : null}
      <Animated.View
        className="min-h-[160px] w-full items-center justify-center rounded-3xl px-4 py-8"
        style={{
          backgroundColor,
          opacity,
          transform: [{ scale }, { translateX }],
        }}
        accessibilityElementsHidden={hideFromAccessibility}
        importantForAccessibility={hideFromAccessibility ? 'no-hide-descendants' : 'auto'}
      >
        <Text
          accessibilityLabel={hideFromAccessibility ? undefined : `Слово: ${word}`}
          accessibilityElementsHidden={hideFromAccessibility}
          style={{ color: textColor, fontSize: 48, lineHeight: 56 }}
          className="text-center font-bold"
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          numberOfLines={2}
        >
          {word}
        </Text>
      </Animated.View>
    </View>
  );
}
