import Svg, { Path } from 'react-native-svg';

type CloseIconProps = {
  color?: string;
  size?: number;
};

export function CloseIcon({ color = '#FB6694', size = 22 }: CloseIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4 L20 20 M20 4 L4 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
