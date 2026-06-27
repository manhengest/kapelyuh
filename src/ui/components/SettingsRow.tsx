import { Pressable, Switch, Text, View } from 'react-native';

type SettingsRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingsToggleRow({ label, description, value, onValueChange }: SettingsRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-3">
      <View className="flex-1">
        <Text className="text-base font-medium text-slate-900 dark:text-white">{label}</Text>
        {description ? (
          <Text className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</Text>
        ) : null}
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

type SettingsLinkRowProps = {
  label: string;
  onPress: () => void;
};

export function SettingsLinkRow({ label, onPress }: SettingsLinkRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="py-3"
    >
      <Text className="text-base font-medium text-blue-600 dark:text-blue-400">{label}</Text>
    </Pressable>
  );
}
