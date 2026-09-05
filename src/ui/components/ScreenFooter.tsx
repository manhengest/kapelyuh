import { Pressable, View } from 'react-native';

import { playTap } from '@infrastructure/audio/sounds';
import { Button } from '@ui/components/Button';
import { ContentColumn } from '@ui/components/ContentColumn';
import { InfoIcon } from '@ui/components/InfoIcon';
import { Text } from '@ui/components/Text';

interface ScreenFooterProps {
  hint?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  secondaryOnPress?: () => void;
  skipLabel?: string;
  skipOnPress?: () => void;
}

export function ScreenFooter({
  hint,
  label,
  onPress,
  disabled,
  secondaryLabel,
  secondaryOnPress,
  skipLabel,
  skipOnPress,
}: ScreenFooterProps) {
  return (
    <ContentColumn>
      <View className="gap-3 px-5 pt-2">
        {hint ? (
          <View className="mb-1 flex-row items-start justify-center gap-1.5">
            <InfoIcon size={20} />
            <Text className="shrink text-xl text-highlightText">{hint}</Text>
          </View>
        ) : null}
        {secondaryLabel && secondaryOnPress ? (
          <Button label={secondaryLabel} variant="outline" onPress={secondaryOnPress} />
        ) : null}
        <Button label={label} onPress={onPress} disabled={disabled} />
        {skipLabel && skipOnPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
            className="min-h-[48px] items-center justify-center py-2"
            onPress={() => {
              playTap();
              skipOnPress();
            }}
          >
            <Text className="text-md text-black underline">{skipLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </ContentColumn>
  );
}
