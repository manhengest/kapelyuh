import { Image } from 'react-native';

import { strings } from '@content/strings';

const logo = require('@assets/images/logo.png');

type AppLogoSize = 'sm' | 'md' | 'lg';

const sizePx: Record<AppLogoSize, number> = {
  sm: 80,
  md: 128,
  lg: 160,
};

type AppLogoProps = {
  size?: AppLogoSize;
  accessibilityLabel?: string;
};

export function AppLogo({ size = 'md', accessibilityLabel = strings.appName }: AppLogoProps) {
  const dimension = sizePx[size];

  return (
    <Image
      source={logo}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: dimension, height: dimension }}
    />
  );
}
