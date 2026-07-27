import { Pressable, View, type PressableProps } from 'react-native';

const SHADOW_DEPTH = 5;
const PRESSED_OFFSET = 3;

type HardShadowPressableProps = Omit<PressableProps, 'children' | 'style'> & {
  faceClassName: string;
  shadowClassName: string;
  shadowColor: string;
  shadowOpacity?: number;
  containerClassName?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
};

export function HardShadowPressable({
  faceClassName,
  shadowClassName,
  shadowColor,
  shadowOpacity = 0.5,
  containerClassName = '',
  fullWidth = true,
  children,
  disabled,
  className = '',
  ...props
}: HardShadowPressableProps) {
  return (
    <Pressable
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...props}
    >
      {({ pressed }) => (
        <View className={`relative w-full ${containerClassName}`}>
          <View
            pointerEvents="none"
            className={`absolute inset-x-0 ${shadowClassName}`}
            style={{
              top: SHADOW_DEPTH,
              backgroundColor: shadowColor,
              opacity: shadowOpacity,
            }}
          />
          <View
            className={`${faceClassName} mb-[5px]`}
            style={{
              transform: [{ translateY: pressed && !disabled ? PRESSED_OFFSET : 0 }],
            }}
          >
            {children}
          </View>
        </View>
      )}
    </Pressable>
  );
}
