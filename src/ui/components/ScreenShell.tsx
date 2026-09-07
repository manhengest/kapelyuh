import type { ReactNode } from 'react';
import { ImageBackground, type ImageSourcePropType, type ViewProps } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { ContentColumn } from '@ui/components/ContentColumn';
import { bg } from '@ui/theme/roundPalette';

type ScreenShellProps = ViewProps & {
  children: ReactNode;
  source?: ImageSourcePropType;
  overlay?: ReactNode;
  edges?: Edges;
};

export function ScreenShell({
  children,
  source = bg,
  overlay,
  edges = ['top', 'left', 'right'],
  className = '',
  ...props
}: ScreenShellProps) {
  return (
    <ImageBackground source={source} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView
        className={`flex-1 ${className}`}
        edges={edges}
        style={{ backgroundColor: 'transparent' }}
        {...props}
      >
        <ContentColumn className="flex-1">{children}</ContentColumn>
      </SafeAreaView>
      {overlay}
    </ImageBackground>
  );
}
