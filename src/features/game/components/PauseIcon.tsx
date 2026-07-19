import { View } from 'react-native';

type PauseIconProps = {
  color?: string;
  size?: number;
};

export function PauseIcon({ color = '#1A1A1A', size = 24 }: PauseIconProps) {
  const barWidth = Math.round(size * 0.28);
  const barHeight = size;
  const gap = Math.round(size * 0.24);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <View
        style={{
          width: barWidth,
          height: barHeight,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: barHeight,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
}
