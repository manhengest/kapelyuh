import { useWindowDimensions } from 'react-native';

import { layout } from '@ui/theme/tokens';

export function useIsWideLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= layout.wideLayoutBreakpoint;
}
