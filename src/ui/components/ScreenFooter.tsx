import { View } from 'react-native';

import { Button } from '@ui/components/Button';
import { ContentColumn } from '@ui/components/ContentColumn';
import { Text } from '@ui/components/Text';

const primaryShadow = {
  shadowColor: '#FEA41E',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.5,
  shadowRadius: 0,
  elevation: 10,
} as const;

interface ScreenFooterProps {
  hint?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  secondaryOnPress?: () => void;
}

export function ScreenFooter({
  hint,
  label,
  onPress,
  disabled,
  secondaryLabel,
  secondaryOnPress,
}: ScreenFooterProps) {
  return (
    <ContentColumn>
      <View className="gap-3 px-5 pb-6">
        {hint ? <Text className="text-md text-center text-highlightText">{hint}</Text> : null}
        {secondaryLabel && secondaryOnPress ? (
          <Button label={secondaryLabel} variant="outline" onPress={secondaryOnPress} />
        ) : null}
        <Button style={primaryShadow} label={label} onPress={onPress} disabled={disabled} />
      </View>
    </ContentColumn>
  );
}
