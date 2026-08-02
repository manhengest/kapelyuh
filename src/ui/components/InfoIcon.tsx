import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type InfoIconProps = {
  color?: string;
  size?: number;
};

export function InfoIcon({ color = '#960856', size = 18, ...props }: React.ComponentProps<typeof Svg> & InfoIconProps) {
  return (
    <View {...props}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <Circle cx="12" cy="8" r="1" fill={color} />
        <Path d="M12 16v-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
