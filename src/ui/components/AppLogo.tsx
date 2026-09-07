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
  rounded?: boolean;
};

export function AppLogo({
  size = 'md',
  accessibilityLabel = strings.appName,
  rounded = false,
}: AppLogoProps) {
  const dimension = sizePx[size];

  return (
    <Image
      source={logo}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: rounded ? dimension / 2 : 0,
      }}
    />
  );
}
