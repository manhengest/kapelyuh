import type { ReactNode } from 'react';
import { ImageBackground, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoundType } from '@domain/game/types';
import { ContentColumn } from '@ui/components/ContentColumn';
import { getRoundBackground } from '@ui/theme/roundPalette';

type GameScreenShellProps = ViewProps & {
  roundType?: RoundType;
  children: ReactNode;
};

export function GameScreenShell({
  roundType,
  children,
  className = '',
  ...props
}: GameScreenShellProps) {
  const backgroundSource = getRoundBackground(roundType);

  return (
    <ImageBackground source={backgroundSource} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className={`flex-1 ${className}`} {...props}>
        <ContentColumn className="flex-1">{children}</ContentColumn>
      </SafeAreaView>
    </ImageBackground>
  );
}
