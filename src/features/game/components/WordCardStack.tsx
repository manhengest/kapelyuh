import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { WordCard } from '@features/game/components/WordCard';
import {
  EXIT_ANIMATION_DURATION_MS,
  EXIT_ANIMATION_DURATION_REDUCED_MS,
  EXIT_SCALE,
  EXIT_TRANSLATE_Y,
  getNextStackWordIds,
  getStackWordIds,
  STACK_ENTER_FROM,
  STACK_LAYER_OFFSETS,
  type WordCardAction,
  WORD_ACTION_COLORS,
} from '@features/game/components/wordCardStackConfig';
import { useReducedMotion } from '@shared/hooks/useReducedMotion';
import { Text } from '@ui/components/Text';

type WordCardStackProps = {
  currentWordId: string | null;
  remainingWordIds: string[];
  wordTexts: Record<string, string>;
  backgroundColor: string;
  textColor: string;
  label?: string;
  onExitComplete: (action: WordCardAction) => void;
};

export type WordCardStackHandle = {
  startExit: (action: WordCardAction) => boolean;
  resetExit: () => void;
};

type StackLayerCardProps = {
  depthIndex: number;
  isFront: boolean;
  isEntering: boolean;
  duration: number;
  word: string;
  backgroundColor: string;
  textColor: string;
  label?: string;
};

function StackLayerCard({
  depthIndex,
  isFront,
  isEntering,
  duration,
  word,
  backgroundColor,
  textColor,
  label,
}: StackLayerCardProps) {
  const layer = STACK_LAYER_OFFSETS[depthIndex] ?? STACK_LAYER_OFFSETS[0];
  const translateY = useSharedValue(isEntering ? STACK_ENTER_FROM.translateY : layer.translateY);
  const scale = useSharedValue(isEntering ? STACK_ENTER_FROM.scale : layer.scale);

  useEffect(() => {
    translateY.value = withTiming(layer.translateY, { duration });
    scale.value = withTiming(layer.scale, { duration });
  }, [duration, layer.scale, layer.translateY, scale, translateY]);

  const layerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents={isFront ? 'auto' : 'none'}
      style={[
        layerStyle,
        {
          position: depthIndex === 0 ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: layer.zIndex,
        },
      ]}
    >
      <WordCard
        word={word}
        backgroundColor={backgroundColor}
        textColor={textColor}
        label={isFront ? label : undefined}
        showWord={isFront}
        isBackCard={!isFront}
        hideFromAccessibility={!isFront}
      />
    </Animated.View>
  );
}

export const WordCardStack = forwardRef<WordCardStackHandle, WordCardStackProps>(
  function WordCardStack(
    {
      currentWordId,
      remainingWordIds,
      wordTexts,
      backgroundColor,
      textColor,
      label,
      onExitComplete,
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const exitDuration = reducedMotion
      ? EXIT_ANIMATION_DURATION_REDUCED_MS
      : EXIT_ANIMATION_DURATION_MS;

    const storeStackIds = useMemo(
      () => getStackWordIds(currentWordId, remainingWordIds),
      [currentWordId, remainingWordIds],
    );

    const [optimisticStackIds, setOptimisticStackIds] = useState<string[] | null>(null);
    const [enteringWordIds, setEnteringWordIds] = useState<string[]>([]);
    const [exitingWordId, setExitingWordId] = useState<string | null>(null);
    const [exitNonce, setExitNonce] = useState(0);

    const stackIds =
      exitingWordId !== null && optimisticStackIds !== null ? optimisticStackIds : storeStackIds;

    const exitTranslateY = useSharedValue(0);
    const exitOpacity = useSharedValue(1);
    const exitProgress = useSharedValue(0);
    const exitColorFrom = useSharedValue(backgroundColor);
    const exitColorTo = useSharedValue<string>(WORD_ACTION_COLORS.guessed);
    const isExiting = useSharedValue(false);

    /* eslint-disable react-hooks/immutability -- reanimated shared values */
    const resetExitState = useCallback(() => {
      isExiting.value = false;
      exitTranslateY.value = 0;
      exitOpacity.value = 1;
      exitProgress.value = 0;
      setExitingWordId(null);
      setOptimisticStackIds(null);
      setEnteringWordIds([]);
    }, [exitOpacity, exitProgress, exitTranslateY, isExiting]);

    const handleExitFinished = useCallback(
      (action: WordCardAction) => {
        onExitComplete(action);
        resetExitState();
      },
      [onExitComplete, resetExitState],
    );

    const startExit = useCallback(
      (action: WordCardAction): boolean => {
        if (isExiting.value || !currentWordId) {
          return false;
        }

        const currentIds = getStackWordIds(currentWordId, remainingWordIds);
        const nextIds = getNextStackWordIds(action, currentWordId, remainingWordIds);
        const entering = nextIds.filter((id) => !currentIds.includes(id));

        const wordId = currentWordId;
        isExiting.value = true;
        setOptimisticStackIds(nextIds);
        setEnteringWordIds(entering);
        setExitingWordId(wordId);
        setExitNonce((nonce) => nonce + 1);

        exitColorFrom.value = backgroundColor;
        exitColorTo.value =
          action === 'guess' ? WORD_ACTION_COLORS.guessed : WORD_ACTION_COLORS.skipped;

        exitTranslateY.value = 0;
        exitOpacity.value = 1;
        exitProgress.value = 0;

        exitTranslateY.value = withTiming(EXIT_TRANSLATE_Y, { duration: exitDuration });
        exitOpacity.value = withTiming(0, { duration: exitDuration });
        exitProgress.value = withTiming(1, { duration: exitDuration }, (finished) => {
          if (finished) {
            runOnJS(handleExitFinished)(action);
          }
        });

        return true;
      },
      [
        backgroundColor,
        currentWordId,
        exitColorFrom,
        exitColorTo,
        exitDuration,
        exitOpacity,
        exitProgress,
        exitTranslateY,
        handleExitFinished,
        isExiting,
        remainingWordIds,
      ],
    );
    /* eslint-enable react-hooks/immutability */

    useImperativeHandle(
      ref,
      () => ({
        startExit,
        resetExit: resetExitState,
      }),
      [resetExitState, startExit],
    );

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
      opacity: exitOpacity.value,
      transform: [{ translateY: exitTranslateY.value }, { scale: EXIT_SCALE }],
    }));

    const overlayCardStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        exitProgress.value,
        [0, 1],
        [exitColorFrom.value, exitColorTo.value],
      ),
    }));

    if (stackIds.length === 0 && !exitingWordId) {
      return null;
    }

    const exitingWord = exitingWordId ? (wordTexts[exitingWordId] ?? exitingWordId) : '';
    const overlayOnly = stackIds.length === 0;
    const showStackPadding = stackIds.length > 1;

    return (
      <View className="w-full" style={{ paddingBottom: showStackPadding ? 16 : 0 }}>
        <View className="relative w-full">
          {stackIds
            .slice()
            .reverse()
            .map((wordId) => {
              const depthIndex = stackIds.indexOf(wordId);
              const isFront = depthIndex === 0;

              return (
                <StackLayerCard
                  key={wordId}
                  depthIndex={depthIndex}
                  isFront={isFront}
                  isEntering={enteringWordIds.includes(wordId)}
                  duration={exitDuration}
                  word={wordTexts[wordId] ?? wordId}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  label={label}
                />
              );
            })}

          {exitingWordId ? (
            <Animated.View
              key={`exit-${exitingWordId}-${exitNonce}`}
              pointerEvents="none"
              style={[
                overlayAnimatedStyle,
                overlayOnly
                  ? undefined
                  : {
                      position: 'absolute' as const,
                      top: 0,
                      left: 0,
                      right: 0,
                      width: '100%',
                      zIndex: 10,
                    },
                {
                  zIndex: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 5, height: 5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 10,
                },
              ]}
              className="w-full items-center gap-2 px-4"
            >
              <View className="h-8 items-center justify-center">
                {label ? (
                  <Text className="text-2xl font-bold uppercase tracking-widest text-primaryText">
                    {label}
                  </Text>
                ) : null}
              </View>
              <Animated.View
                className="min-h-[200px] w-full items-center justify-center rounded-3xl px-4 py-8"
                style={overlayCardStyle}
              >
                <Text
                  style={{ color: textColor, fontSize: 80 }}
                  className="text-center font-bold uppercase"
                  adjustsFontSizeToFit
                  minimumFontScale={0.25}
                  numberOfLines={1}
                >
                  {exitingWord}
                </Text>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>
      </View>
    );
  },
);
