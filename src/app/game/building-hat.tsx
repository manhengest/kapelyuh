import { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useGameActions, useGameState } from '@features/game/hooks';
import { playTap } from '@infrastructure/audio/sounds';
import { triggerHaptic } from '@infrastructure/haptics';
import { addCustomWord, getCustomWordIds } from '@infrastructure/storage/customWords';
import { ContentColumn } from '@ui/components/ContentColumn';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';
import { TextInput } from '@ui/components/TextInput';

const hatIcon = require('@assets/images/icons/landing/hat.png');
const mainBg = require('@assets/images/main-bg.jpg');

const EARLY_FINISH_MIN = 30;
const MAX_WORD_LENGTH = 24;

export default function BuildingHatScreen() {
  const { settings } = useGameState();
  const { dispatch } = useGameActions();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(() => getCustomWordIds().length);
  const [earlyConfirmed, setEarlyConfirmed] = useState(false);
  const submittingRef = useRef(false);
  const inputRef = useRef<RNTextInput>(null);

  const target = settings.wordCount;
  const isReady = count >= target || (earlyConfirmed && count >= EARLY_FINISH_MIN);
  const canEarlyFinish = !isReady && count >= EARLY_FINISH_MIN && count < target;

  const completeHat = () => {
    dispatch({ type: 'HAT_COMPLETED', sessionWordIds: getCustomWordIds() });
  };

  const keepKeyboardUp = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const onAdd = () => {
    if (submittingRef.current || isReady) {
      return;
    }
    submittingRef.current = true;
    const result = addCustomWord(draft);
    if (result === 'empty') {
      submittingRef.current = false;
      keepKeyboardUp();
      return;
    }
    if (result === 'duplicate') {
      setError(strings.buildingHat.duplicate);
      void triggerHaptic('warning');
      submittingRef.current = false;
      keepKeyboardUp();
      return;
    }

    playTap();
    void triggerHaptic('light');
    setDraft('');
    setError(null);
    const nextCount = getCustomWordIds().length;
    setCount(nextCount);
    submittingRef.current = false;

    const nowReady = nextCount >= target || (earlyConfirmed && nextCount >= EARLY_FINISH_MIN);
    if (!nowReady) {
      keepKeyboardUp();
    }
  };

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            bounces={false}
          >
            <ContentColumn className="flex-1">
              <ScreenHeader onBack={() => dispatch({ type: 'BACK_TO_TEAMS' })} />
              <View className="flex-1 items-center justify-center px-6">
                <Image source={hatIcon} style={{ width: 150, height: 150 }} resizeMode="contain" />
                {isReady ? (
                  <View className="mt-6 items-center gap-3">
                    <Text className="text-center text-4xl font-bold leading-tight text-primaryText">
                      {strings.buildingHat.readyTitle}
                    </Text>
                    <Text className="text-center text-2xl font-bold text-primaryText">
                      {strings.buildingHat.readyCount(count)}
                    </Text>
                    <Text className="text-center text-xl text-highlightText">
                      {strings.buildingHat.readyNote}
                    </Text>
                  </View>
                ) : (
                  <View className="mt-6 w-full items-center gap-4">
                    <Text className="text-center text-4xl font-bold text-primaryText">
                      {strings.buildingHat.title}
                    </Text>
                    <Text className="text-center text-xl text-highlightText">
                      {strings.buildingHat.subtitle}
                    </Text>
                    <Text className="text-3xl font-bold text-pink">
                      {count} / {target}
                    </Text>
                    <TextInput
                      ref={inputRef}
                      value={draft}
                      onChangeText={(value) => {
                        setDraft(value);
                        if (error) {
                          setError(null);
                        }
                      }}
                      onSubmitEditing={onAdd}
                      placeholder={strings.buildingHat.placeholder}
                      maxLength={MAX_WORD_LENGTH}
                      returnKeyType="done"
                      blurOnSubmit={false}
                      autoFocus
                      accessibilityLabel={strings.buildingHat.placeholder}
                      className="min-h-[56px] w-full rounded-2xl border border-pickerBorder bg-white px-4 text-xl font-bold text-primaryText"
                    />
                    <Text
                      className="min-h-6 text-center text-base font-bold text-pink"
                      accessibilityLiveRegion="polite"
                    >
                      {error ?? ' '}
                    </Text>
                  </View>
                )}
              </View>
              {isReady ? (
                <ScreenFooter label={strings.buildingHat.startGame} onPress={completeHat} />
              ) : (
                <ScreenFooter
                  hint={strings.buildingHat.passPhone}
                  label={strings.buildingHat.add}
                  onPress={onAdd}
                  skipLabel={canEarlyFinish ? strings.buildingHat.earlyFinish : undefined}
                  skipOnPress={canEarlyFinish ? () => setEarlyConfirmed(true) : undefined}
                />
              )}
            </ContentColumn>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
