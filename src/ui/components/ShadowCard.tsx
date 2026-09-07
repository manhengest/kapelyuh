import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 5, height: 5 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 10,
} as const;

type ShadowCardProps = ViewProps & {
  children: ReactNode;
};

export function ShadowCard({ children, style, ...props }: ShadowCardProps) {
  return (
    <View style={[CARD_SHADOW, style]} {...props}>
      {children}
    </View>
  );
}
