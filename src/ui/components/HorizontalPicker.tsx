import { Pressable, View } from 'react-native';

import { playTap } from '@infrastructure/audio/sounds';
import { Text } from '@ui/components/Text';

type HorizontalPickerProps<T extends string | number> = {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  formatOption?: (value: T) => string;
};

export function HorizontalPicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  formatOption = (option) => String(option),
}: HorizontalPickerProps<T>) {
  return (
    <View className="w-full">
      <Text className="picker-title">{label}</Text>
      <View className="w-full flex-row gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={String(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                if (!selected) {
                  playTap();
                }
                onChange(option);
              }}
              className={`picker-option flex-1 items-center justify-center ${selected ? 'picker-option--selected' : ''}`}
            >
              <Text
                className={`picker-option-text ${selected ? 'picker-option-text--selected' : ''}`}
              >
                {formatOption(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
