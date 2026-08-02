import { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react';
import { Image, type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { guessedIcon, skipIcon } from '@features/game/components/turnActionIcons';
import { WordCard } from '@features/game/components/WordCard';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';

const SWIPE_VELOCITY_THRESHOLD = 800;
const SWIPE_DISTANCE_RATIO = 0.3;
const EXIT_DISTANCE_RATIO = 1.5;
const CARD_OPACITY_FADE = 0.55;
const EXIT_DURATION_MS = 200;
const EXIT_DURATION_REDUCED_MS = 80;
const FALLBACK_CARD_WIDTH = 300;
const REVEAL_ICON_SIZE = 100;
const REVEAL_ICON_SCALE_MIN = 0.55;
const REVEAL_ICON_SCALE_MAX = 1;

type SwipeableWordCardProps = {
  word: string;
  backgroundColor: string;
  textColor?: string;
  label?: string;
  hideFromAccessibility?: boolean;
  feedback?: 'guess' | 'skip' | null;
  onSwipeGuess: () => void;
  onSwipeSkip: () => void;
  enabled?: boolean;
};

export type SwipeableWordCardHandle = {
  triggerExit: (direction: 'left' | 'right') => void;
};

function getSwipeProgress(translateX: number, threshold: number) {
  'worklet';
  if (threshold <= 0) {
    return 0;
  }
  const progress = Math.abs(translateX) / threshold;
  return progress > 1 ? 1 : progress;
}

function getRevealIconStyle(translateX: number, cardWidth: number, direction: 'left' | 'right') {
  'worklet';
  const width = cardWidth > 0 ? cardWidth : FALLBACK_CARD_WIDTH;
  const exitDistance = width * EXIT_DISTANCE_RATIO;
  const visible = direction === 'left' ? translateX < 0 : translateX > 0;

  if (!visible || exitDistance <= 0) {
    return {
      opacity: 0,
      transform: [{ scale: REVEAL_ICON_SCALE_MIN }],
    };
  }

  const progress = Math.min(Math.abs(translateX) / exitDistance, 1);
  const scale = REVEAL_ICON_SCALE_MIN + progress * (REVEAL_ICON_SCALE_MAX - REVEAL_ICON_SCALE_MIN);

  return {
    opacity: progress,
    transform: [{ scale }],
  };
}

export const SwipeableWordCard = forwardRef<SwipeableWordCardHandle, SwipeableWordCardProps>(
  function SwipeableWordCard({ onSwipeGuess, onSwipeSkip, enabled = true, ...wordCardProps }, ref) {
    const reducedMotion = useReducedMotion();
    const exitDuration = reducedMotion ? EXIT_DURATION_REDUCED_MS : EXIT_DURATION_MS;
    const translateX = useSharedValue(0);
    const cardWidth = useSharedValue(FALLBACK_CARD_WIDTH);
    const isExiting = useSharedValue(false);

    const commitSwipe = useCallback(
      (direction: 'left' | 'right') => {
        if (direction === 'right') {
          onSwipeGuess();
        } else {
          onSwipeSkip();
        }
      },
      [onSwipeGuess, onSwipeSkip],
    );

    const startExit = useCallback(
      (direction: 'left' | 'right') => {
        runOnUI((dir: 'left' | 'right') => {
          'worklet';
          if (isExiting.value) {
            return;
          }

          isExiting.value = true;
          const width = cardWidth.value > 0 ? cardWidth.value : FALLBACK_CARD_WIDTH;
          const target =
            dir === 'right' ? width * EXIT_DISTANCE_RATIO : -width * EXIT_DISTANCE_RATIO;

          translateX.value = withTiming(target, { duration: exitDuration }, (finished) => {
            if (finished) {
              translateX.value = 0;
              isExiting.value = false;
              runOnJS(commitSwipe)(dir);
            }
          });
        })(direction);
      },
      // Shared values are stable refs; worklet closes over them intentionally.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- reanimated shared values
      [commitSwipe, exitDuration],
    );

    useImperativeHandle(
      ref,
      () => ({
        triggerExit: startExit,
      }),
      [startExit],
    );

    const pan = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetX([-20, 20])
          .failOffsetY([-15, 15])
          .enabled(enabled)
          .onUpdate((event) => {
            if (isExiting.value) {
              return;
            }
            translateX.value = event.translationX;
          })
          .onEnd((event) => {
            if (isExiting.value) {
              return;
            }

            const width = cardWidth.value > 0 ? cardWidth.value : FALLBACK_CARD_WIDTH;
            const threshold = width * SWIPE_DISTANCE_RATIO;

            if (
              event.translationX >= 0 &&
              (event.translationX > threshold || event.velocityX > SWIPE_VELOCITY_THRESHOLD)
            ) {
              runOnJS(startExit)('right');
              return;
            }

            if (
              event.translationX < 0 &&
              (event.translationX < -threshold || event.velocityX < -SWIPE_VELOCITY_THRESHOLD)
            ) {
              runOnJS(startExit)('left');
              return;
            }

            translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
          }),
      // Shared values are stable refs; gesture handlers close over them intentionally.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- reanimated shared values
      [enabled, startExit],
    );

    const cardAnimatedStyle = useAnimatedStyle(() => {
      const width = cardWidth.value > 0 ? cardWidth.value : FALLBACK_CARD_WIDTH;
      const threshold = width * SWIPE_DISTANCE_RATIO;
      const progress = getSwipeProgress(translateX.value, threshold);
      const rotate = (translateX.value / width) * 8;

      return {
        opacity: 1 - progress * CARD_OPACITY_FADE,
        transform: [{ translateX: translateX.value }, { rotate: `${rotate}deg` }],
      };
    });

    const skipRevealStyle = useAnimatedStyle(() => {
      return getRevealIconStyle(translateX.value, cardWidth.value, 'left');
    });

    const guessRevealStyle = useAnimatedStyle(() => {
      return getRevealIconStyle(translateX.value, cardWidth.value, 'right');
    });

    const onLayout = (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      runOnUI((nextWidth: number) => {
        cardWidth.value = nextWidth;
      })(width);
    };

    return (
      <View className="w-full">
        <View className="absolute inset-0 px-4" pointerEvents="none">
          <View className="items-center gap-2">
            <View className="h-8" />
            <View className="min-h-[200px] w-full">
              <Animated.View
                className="absolute inset-0 items-center justify-center"
                style={skipRevealStyle}
              >
                <Image
                  source={skipIcon}
                  style={{ width: REVEAL_ICON_SIZE, height: REVEAL_ICON_SIZE }}
                  resizeMode="contain"
                />
              </Animated.View>
              <Animated.View
                className="absolute inset-0 items-center justify-center"
                style={guessRevealStyle}
              >
                <Image
                  source={guessedIcon}
                  style={{ width: REVEAL_ICON_SIZE, height: REVEAL_ICON_SIZE }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </View>
        </View>

        <GestureDetector gesture={pan}>
          <Animated.View className="w-full" style={cardAnimatedStyle} onLayout={onLayout}>
            <WordCard {...wordCardProps} />
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);
