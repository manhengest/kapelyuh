import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';

import { playTap } from '@infrastructure/audio/sounds';
import { Text } from '@ui/components/Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  disabled = false,
  className = '',
  onPress,
  ...props
}: ButtonProps) {
  const handlePress = (event: GestureResponderEvent) => {
    playTap();
    onPress?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={handlePress}
      className={`btn btn--${variant} ${disabled ? 'btn--disabled' : ''} ${className}`}
      {...props}
    >
      <Text className={`btn-text btn-text--${variant} ${disabled ? 'btn-text--disabled' : ''}`}>
        {label}
      </Text>
    </Pressable>
  );
}
