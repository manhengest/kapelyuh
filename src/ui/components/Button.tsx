import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';

import { playTap } from '@infrastructure/audio/sounds';
import { HardShadowPressable } from '@ui/components/HardShadowPressable';
import { Text } from '@ui/components/Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonTextSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  textSize?: ButtonTextSize;
  textClassName?: string;
  disabled?: boolean;
};

const VARIANT_CLASS = {
  primary: 'btn btn--primary',
  outline: 'btn btn--outline',
  secondary: 'btn btn--primary',
  danger: 'btn btn--primary',
} as const;

const TEXT_VARIANT_CLASS = {
  primary: 'btn-text',
  outline: 'btn-text',
  secondary: 'btn-text',
  danger: 'btn-text',
} as const;

export function Button({
  label,
  variant = 'primary',
  disabled = false,
  className = '',
  textClassName = '',
  onPress,
  style: _style,
  ...props
}: ButtonProps) {
  const handlePress = (event: GestureResponderEvent) => {
    playTap();
    onPress?.(event);
  };

  const faceClassName = `${VARIANT_CLASS[variant]} ${disabled ? 'btn--disabled' : ''} ${className}`;
  const textClassNames = `${TEXT_VARIANT_CLASS[variant]} ${disabled ? 'btn-text--disabled' : ''} ${textClassName}`;

  if (variant !== 'outline' && !disabled) {
    return (
      <HardShadowPressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={handlePress}
        faceClassName={faceClassName}
        shadowClassName="min-h-[60px] rounded-[30px]"
        shadowColor="#FEA41E"
        shadowOpacity={0.5}
        {...props}
      >
        <Text className={textClassNames}>{label}</Text>
      </HardShadowPressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={handlePress}
      className={faceClassName}
      style={_style}
      {...props}
    >
      <Text className={textClassNames}>{label}</Text>
    </Pressable>
  );
}
