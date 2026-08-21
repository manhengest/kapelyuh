import { useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import type { Difficulty, MatchSettings } from '@domain/game/types';
import { DEFAULT_MATCH_SETTINGS } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { useAppSettings } from '@features/settings/store';
import { ContentColumn } from '@ui/components/ContentColumn';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { HorizontalSlider, snapSliderValue } from '@ui/components/HorizontalSlider';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';

const mainBg = require('@assets/images/main-bg.jpg');

const TURN_DURATIONS_SEC = [60, 90, 120] as const;
const TEAM_COUNTS = [2, 3, 4, 5] as const;
const WORD_COUNT_MIN = 30;
const WORD_COUNT_MAX = 150;
const WORD_COUNT_STEP = 10;

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 10,
      }}
      className="rounded-3xl bg-white px-6 py-4"
    >
      {children}
    </View>
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

  const difficultyOptions = useMemo<Difficulty[]>(() => ['easy', 'medium', 'hard'], []);
  const difficultyLabels: Record<Difficulty, string> = {
    easy: strings.setup.difficultyEasy,
    medium: strings.setup.difficultyMedium,
    hard: strings.setup.difficultyHard,
  };

  const onNext = () => {
    dispatch({ type: 'SETTINGS_COMPLETED', settings });
  };

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ContentColumn className="flex-1">
          <ScreenHeader
            title={strings.setup.title}
            backIcon="home"
            onBack={() => router.replace('/')}
          />
          <ScrollView className="flex-1 px-6" contentContainerClassName="pt-4">
            <View className="gap-3">
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
              </SettingsCard>
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
            </View>
          </ScrollView>
          <ScreenFooter
            hint={strings.setup.wordSetNote}
            label={strings.common.next}
            onPress={onNext}
          />
        </ContentColumn>
      </SafeAreaView>
    </ImageBackground>
  );
}
