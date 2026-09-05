import { useRef, useState } from 'react';
import {
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { triggerHaptic } from '@infrastructure/haptics';
import { Text } from '@ui/components/Text';

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 28;
const HIT_HEIGHT = 48;

type HorizontalSliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export function snapSliderValue(value: number, min: number, max: number, step: number): number {
  if (step <= 0 || max <= min) {
    return Math.min(max, Math.max(min, value));
  }
  const snapped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function valueFromX(x: number, width: number, min: number, max: number, step: number): number {
  if (width <= 0) {
    return min;
  }
  const ratio = clamp(x / width, 0, 1);
  return snapSliderValue(min + ratio * (max - min), min, max, step);
}

export function HorizontalSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: HorizontalSliderProps) {
  const snappedValue = snapSliderValue(value, min, max, step);
  const [trackWidth, setTrackWidth] = useState(0);
  const originXRef = useRef(0);

  const progress = max <= min ? 0 : (snappedValue - min) / (max - min);
  const visualX = progress * trackWidth;

  const applyPageX = (pageX: number) => {
    if (trackWidth <= 0) {
      return;
    }
    const x = clamp(pageX - originXRef.current, 0, trackWidth);
    const next = valueFromX(x, trackWidth, min, max, step);
    if (next === snappedValue) {
      return;
    }
    triggerHaptic('light');
    onChange(next);
  };

  const onGrant = (event: GestureResponderEvent) => {
    originXRef.current = event.nativeEvent.pageX - event.nativeEvent.locationX;
    applyPageX(event.nativeEvent.pageX);
  };

  const onMove = (event: GestureResponderEvent) => {
    applyPageX(event.nativeEvent.pageX);
  };

  const onRelease = () => {
    return;
  };

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const action = event.nativeEvent.actionName;
    if (action !== 'increment' && action !== 'decrement') {
      return;
    }
    const next = snapSliderValue(
      snappedValue + (action === 'increment' ? step : -step),
      min,
      max,
      step,
    );
    if (next === snappedValue) {
      return;
    }
    triggerHaptic('light');
    onChange(next);
  };

  const thumbLeft =
    trackWidth <= 0 ? 0 : clamp(visualX - THUMB_SIZE / 2, 0, trackWidth - THUMB_SIZE);

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-xl font-bold">{label}</Text>
        <Text className="text-2xl font-bold text-pink">{snappedValue}</Text>
      </View>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: snappedValue }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
      >
        <View
          className="w-full justify-center"
          style={{ height: HIT_HEIGHT }}
          pointerEvents="box-only"
          onLayout={onLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={onGrant}
          onResponderMove={onMove}
          onResponderRelease={onRelease}
          onResponderTerminate={onRelease}
        >
          <View
            className="overflow-hidden rounded-full border border-pickerBorder bg-pickerSurface"
            style={{ height: TRACK_HEIGHT }}
            pointerEvents="none"
          >
            <View className="h-full rounded-full bg-pink" style={{ width: visualX }} />
          </View>
          <View
            className="absolute rounded-full border-[3px] border-white bg-pink"
            pointerEvents="none"
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              top: (HIT_HEIGHT - THUMB_SIZE) / 2,
              transform: [{ translateX: thumbLeft }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            }}
          />
        </View>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm font-bold text-disabledText">{min}</Text>
        <Text className="text-sm font-bold text-disabledText">{max}</Text>
      </View>
    </View>
  );
}
