import { useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { strings } from '@content/strings';
import type { Difficulty, MatchSettings, WordSource } from '@domain/game/types';
import { DEFAULT_MATCH_SETTINGS } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { useAppSettings } from '@features/settings/store';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { HorizontalSlider, snapSliderValue } from '@ui/components/HorizontalSlider';
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

  const difficultyOptions = useMemo<Difficulty[]>(() => ['easy', 'medium', 'hard'], []);
  const difficultyLabels: Record<Difficulty, string> = {
    easy: strings.setup.difficultyEasy,
    medium: strings.setup.difficultyMedium,
    hard: strings.setup.difficultyHard,
  };
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
              <HorizontalPicker
                label={strings.setup.difficulty}
                options={difficultyOptions}
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
    </ScreenShell>
  );
}
