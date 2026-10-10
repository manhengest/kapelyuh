import { useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { difficultyLabels, strings } from '@content/strings';
import type { MatchSettings, WordSource } from '@domain/game/types';
import { DEFAULT_MATCH_SETTINGS, DIFFICULTY_ORDER } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { useAppSettings } from '@features/settings/store';
import { playTap } from '@infrastructure/audio/sounds';
import { Button } from '@ui/components/Button';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { HorizontalSlider, snapSliderValue } from '@ui/components/HorizontalSlider';
import { InfoIcon } from '@ui/components/InfoIcon';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const TURN_DURATIONS_SEC = __DEV__ ? [15, 60, 90, 120] : [60, 90, 120];
const TEAM_COUNTS = [2, 3, 4, 5] as const;
const WORD_COUNT_MIN = __DEV__ ? 10 : 30;
const WORD_COUNT_MAX = 150;
const WORD_COUNT_STEP = 10;

function SettingsCard({ children }: { children: ReactNode }) {
  return <ShadowCard className="rounded-3xl bg-white px-6 py-4">{children}</ShadowCard>;
}

function DifficultyHelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
          <Text className="mb-4 text-center text-2xl font-bold text-black">
            {strings.setup.difficultyHelp.title}
          </Text>
          <View className="mb-6 gap-4">
            {DIFFICULTY_ORDER.map((id) => (
              <View key={id} className="gap-1">
                <Text className="text-lg font-extrabold text-black">{difficultyLabels[id]}</Text>
                <Text className="text-base leading-5 text-slate-600">
                  {strings.setup.difficultyHelp.body[id]}
                </Text>
              </View>
            ))}
          </View>
          <Button textClassName="text-xl" label={strings.common.understand} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const settingsFromStore = useGameState().settings;
  const { dispatch } = useGameActions();
  const appSettings = useAppSettings();

  const [settings, setSettings] = useState<MatchSettings>(() => {
    const base = settingsFromStore ?? DEFAULT_MATCH_SETTINGS;
    return {
      ...base,
      skipPenalty: appSettings.skipPenaltyEnabled ? -1 : 0,
      wordCount: snapSliderValue(base.wordCount, WORD_COUNT_MIN, WORD_COUNT_MAX, WORD_COUNT_STEP),
    };
  });

  const [difficultyHelpVisible, setDifficultyHelpVisible] = useState(false);
  const wordSourceOptions = useMemo<WordSource[]>(() => ['bundled', 'custom'], []);
  const wordSourceLabels: Record<WordSource, string> = {
    bundled: strings.setup.wordSourceBundled,
    custom: strings.setup.wordSourceCustom,
  };
  const isCustomHat = settings.wordSource === 'custom';

  const onNext = () => {
    dispatch({ type: 'SETTINGS_COMPLETED', settings });
  };

  return (
    <ScreenShell>
      <ScreenHeader
        title={strings.setup.title}
        backIcon="home"
        onBack={() => router.replace('/')}
      />
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-48 pt-4">
        <View className="gap-3">
          <SettingsCard>
            <HorizontalPicker
              label={strings.setup.wordSet}
              options={wordSourceOptions}
              value={settings.wordSource}
              onChange={(wordSource) => setSettings((current) => ({ ...current, wordSource }))}
              formatOption={(source) => wordSourceLabels[source]}
            />
            {isCustomHat ? (
              <Text className="mt-3 text-center text-base text-highlightText">
                {strings.setup.customHatHint}
              </Text>
            ) : null}
          </SettingsCard>
          <SettingsCard>
            <HorizontalPicker
              label={strings.setup.turnDuration}
              options={[...TURN_DURATIONS_SEC]}
              value={settings.turnDurationMs / 1000}
              onChange={(seconds) =>
                setSettings((current) => ({ ...current, turnDurationMs: seconds * 1000 }))
              }
            />
          </SettingsCard>
          <SettingsCard>
            <HorizontalPicker
              label={strings.setup.teamCount}
              options={[...TEAM_COUNTS]}
              value={settings.teamCount}
              onChange={(teamCount) => setSettings((current) => ({ ...current, teamCount }))}
            />
          </SettingsCard>
          <SettingsCard>
            <HorizontalSlider
              label={strings.setup.wordCount}
              min={WORD_COUNT_MIN}
              max={WORD_COUNT_MAX}
              step={WORD_COUNT_STEP}
              value={settings.wordCount}
              onChange={(wordCount) => setSettings((current) => ({ ...current, wordCount }))}
            />
            {isCustomHat ? (
              <Text className="mt-2 text-center text-base text-highlightText">
                {strings.setup.customWordCountNote}
              </Text>
            ) : null}
          </SettingsCard>
          {isCustomHat ? null : (
            <SettingsCard>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={strings.setup.difficultyHelp.openLabel}
                hitSlop={8}
                onPress={() => {
                  playTap();
                  setDifficultyHelpVisible(true);
                }}
                className="absolute right-1 top-1 z-10 size-12 items-center justify-center"
              >
                <InfoIcon size={22} color="#FB6694" />
              </Pressable>
              <HorizontalPicker
                label={strings.setup.difficulty}
                options={DIFFICULTY_ORDER}
                value={settings.difficulties[0]}
                onChange={(difficulty) =>
                  setSettings((current) => ({ ...current, difficulties: [difficulty] }))
                }
                formatOption={(d) => difficultyLabels[d]}
              />
            </SettingsCard>
          )}
        </View>
      </ScrollView>
      <ScreenFooter
        hint={strings.setup.wordSetNote}
        hintVariant="pill"
        label={strings.common.next}
        onPress={onNext}
      />
      <DifficultyHelpModal
        visible={difficultyHelpVisible}
        onClose={() => setDifficultyHelpVisible(false)}
      />
    </ScreenShell>
  );
}
