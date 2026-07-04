import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { nunitoFamilyForWeight } from '@ui/theme/fonts';

export const Text = forwardRef<RNText, TextProps>(function AppText({ style, ...props }, ref) {
  const flat = StyleSheet.flatten(style);
  const family = nunitoFamilyForWeight(flat?.fontWeight);

  return (
    <RNText
      ref={ref}
      {...props}
      style={[style, { fontFamily: family, fontWeight: undefined }]}
    />
  );
});

cssInterop(Text, { className: 'style' });

export const AnimatedText = Animated.createAnimatedComponent(Text);
