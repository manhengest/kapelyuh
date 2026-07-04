import { View } from 'react-native';

import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';

interface SettingsFooterProps {
  hint: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function SettingsFooter({ hint, label, onPress, disabled }: SettingsFooterProps) {
  return (
    <View className="px-24 pb-6">
      <Text className="text-md mb-5 text-center text-highlightText">{hint}</Text>
      <Button
        style={{
          shadowColor: '#FEA41E',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.5,
          shadowRadius: 0,
          elevation: 10,
        }}
        label={label}
        disabled={disabled}
        onPress={onPress}
      />
    </View>
  );
}
