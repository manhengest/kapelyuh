import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

import type { RoundType } from '@domain/game/types';
import { ScreenShell } from '@ui/components/ScreenShell';
import { getRoundBackground } from '@ui/theme/roundPalette';

type GameScreenShellProps = ViewProps & {
  roundType?: RoundType;
  children: ReactNode;
};

export function GameScreenShell({ roundType, children, ...props }: GameScreenShellProps) {
  return (
    <ScreenShell source={getRoundBackground(roundType)} {...props}>
      {children}
    </ScreenShell>
  );
}
