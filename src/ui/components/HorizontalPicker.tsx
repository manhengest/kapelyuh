import { ScrollView, Pressable, Text, View } from 'react-native';

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
    <View className="mb-6">
      <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        <View className="flex-row gap-2 px-1">
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={String(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(option)}
                className={`rounded-2xl px-5 py-3 ${selected ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                <Text
                  className={`text-base font-semibold ${selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}
                >
                  {formatOption(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

type MultiPickerProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (value: T) => void;
};

export function MultiPicker<T extends string>({
  label,
  options,
  values,
  onToggle,
}: MultiPickerProps<T>) {
  return (
    <View className="mb-6">
      <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onToggle(option.value)}
              className={`rounded-2xl px-4 py-3 ${selected ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}
            >
              <Text
                className={`text-sm font-semibold ${selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
