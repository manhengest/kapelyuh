import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500',
  secondary: 'bg-slate-700',
  outline: 'border-2 border-slate-300 bg-transparent dark:border-slate-600',
  danger: 'bg-red-500',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-slate-900 dark:text-white',
  danger: 'text-white',
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
      className={`min-h-[48px] items-center justify-center rounded-2xl px-5 py-3 ${variantClasses[variant]} ${disabled ? 'opacity-40' : ''} ${className}`}
      {...props}
    >
      <Text className={`text-center text-base font-semibold ${textClasses[variant]}`}>{label}</Text>
    </Pressable>
  );
}
