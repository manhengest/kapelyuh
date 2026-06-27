import { useEffect } from 'react';
import { Appearance } from 'react-native';

import { useAppSettings } from '@features/settings/store';

export function ThemeSync() {
  const theme = useAppSettings().theme;

  useEffect(() => {
    Appearance.setColorScheme(theme === 'system' ? 'unspecified' : theme);
  }, [theme]);

  return null;
}
