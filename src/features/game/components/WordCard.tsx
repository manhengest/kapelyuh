import { useEffect, useMemo } from 'react';
import { Animated, View } from 'react-native';

import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { Text } from '@ui/components/Text';

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
    <View
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 10,
      }}
      className="w-full items-center gap-2 px-4"
    >
      <Text
        className="text-2xl font-bold uppercase tracking-widest text-primaryText"
        style={{ opacity: label ? 1 : 0 }}
      >
        {label ?? ' '}
      </Text>
      <Animated.View
        className="min-h-[200px] w-full items-center justify-center rounded-3xl px-4 py-8"
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
          style={{ color: textColor, fontSize: 80, lineHeight: 90 }}
          className="text-center font-bold uppercase"
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
