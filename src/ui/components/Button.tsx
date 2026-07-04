import { Pressable, type PressableProps } from 'react-native';

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
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      className={`btn btn--${variant} ${disabled ? 'btn--disabled' : ''} ${className}`}
      {...props}
    >
      <Text className={`btn-text btn-text--${variant}`}>{label}</Text>
    </Pressable>
  );
}
