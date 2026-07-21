import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { layout } from '@ui/theme/tokens';

type ContentColumnProps = ViewProps & {
  children: ReactNode;
};

export function ContentColumn({ children, className = '', style, ...props }: ContentColumnProps) {
  return (
    <View
      className={`w-full self-center ${className}`}
      style={[{ maxWidth: layout.contentMaxWidth }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
