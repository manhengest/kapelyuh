import Svg, { Path } from 'react-native-svg';

type HomeIconProps = {
  color?: string;
  size?: number;
};

export function HomeIcon({ color = '#FD7698', size = 22 }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5L12 4l8 6.5V20a1.5 1.5 0 01-1.5 1.5H15v-6.5H9V21.5H5.5A1.5 1.5 0 014 20v-9.5z"
        fill={color}
      />
    </Svg>
  );
}
