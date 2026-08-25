import { Image, ImageSourcePropType, Pressable, View } from 'react-native';

import { guessedIcon, skipIcon } from '@features/game/components/turnActionIcons';
import { Text } from '@ui/components/Text';

type ActionButtonProps = {
  label: string;
  icon: ImageSourcePropType;
  backgroundClassName: string;
  onPress: () => void;
  disabled: boolean;
};

function ActionButton({ label, icon, backgroundClassName, onPress, disabled }: ActionButtonProps) {
  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        className={`h-44 w-44 items-center justify-center rounded-3xl ${backgroundClassName}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 5, height: 5 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 10,
        }}
      >
        <Image source={icon} style={{ width: 60, height: 60 }} resizeMode="contain" />
        <Text className="mt-5 text-2xl font-bold text-primaryText">{label}</Text>
      </Pressable>
    </View>
  );
}

type ActionButtonsProps = {
  onGuess: () => void;
  onSkip: () => void;
  guessDisabled?: boolean;
  skipDisabled?: boolean;
};

export function ActionButtons({
  onGuess,
  onSkip,
  guessDisabled = false,
  skipDisabled = false,
}: ActionButtonsProps) {
  return (
    <View className="flex-row items-end justify-center gap-6">
      <ActionButton
        label="Пропустити"
        icon={skipIcon}
        backgroundClassName="bg-white"
        onPress={onSkip}
        disabled={skipDisabled}
      />
      <ActionButton
        label="Відгадано"
        icon={guessedIcon}
        backgroundClassName="bg-primaryBtn"
        onPress={onGuess}
        disabled={guessDisabled}
      />
    </View>
  );
}
