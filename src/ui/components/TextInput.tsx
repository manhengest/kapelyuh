import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { TextInput as RNTextInput, StyleSheet, type TextInputProps } from 'react-native';

import { nunitoFamilyForWeight } from '@ui/theme/fonts';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function AppTextInput(
  { style, ...props },
  ref,
) {
  const flat = StyleSheet.flatten(style);
  const family = nunitoFamilyForWeight(flat?.fontWeight);

  return (
    <RNTextInput
      ref={ref}
      {...props}
      style={[style, { fontFamily: family, fontWeight: undefined }]}
    />
  );
});

cssInterop(TextInput, { className: 'style' });
