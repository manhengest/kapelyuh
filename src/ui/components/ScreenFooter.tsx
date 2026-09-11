import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playTap } from '@infrastructure/audio/sounds';
import { Button } from '@ui/components/Button';
import { ContentColumn } from '@ui/components/ContentColumn';
import { InfoIcon } from '@ui/components/InfoIcon';
import { Text } from '@ui/components/Text';

interface ScreenFooterProps {
  hint?: string;
  hintVariant?: 'plain' | 'pill';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  secondaryOnPress?: () => void;
  skipLabel?: string;
  skipOnPress?: () => void;
  /** Keep the footer in document flow (e.g. inside a ScrollView). */
  inline?: boolean;
}

export function ScreenFooter({
  hint,
  hintVariant = 'plain',
  label,
  onPress,
  disabled,
  secondaryLabel,
  secondaryOnPress,
  skipLabel,
  skipOnPress,
  inline = false,
}: ScreenFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={
        inline
          ? { backgroundColor: 'transparent' }
          : {
              position: 'absolute',
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 10,
              backgroundColor: 'transparent',
              paddingBottom: Math.max(insets.bottom, 8),
            }
      }
    >
      <ContentColumn pointerEvents="box-none" style={{ backgroundColor: 'transparent' }}>
        <View
          pointerEvents="box-none"
          className="gap-3 px-5 pt-2"
          style={{ backgroundColor: 'transparent' }}
        >
          {hint ? (
            <View
              className={`screen-footer-hint ${hintVariant === 'pill' ? 'screen-footer-hint--pill' : ''}`}
            >
              <InfoIcon size={20} />
              <Text className="screen-footer-hint-text">{hint}</Text>
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
              <Text className="screen-footer-skip">{skipLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </ContentColumn>
    </View>
  );
}
