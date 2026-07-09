import { useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import type { Difficulty, MatchSettings } from '@domain/game/types';
import { DEFAULT_MATCH_SETTINGS } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';

const mainBg = require('@assets/images/main-bg.png');

const WORD_COUNTS = [30, 60, 90] as const;
const TURN_DURATIONS_SEC = [60, 90, 120] as const;
const TEAM_COUNTS = [2, 3, 4] as const;

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
      className="rounded-3xl bg-white px-8 py-6"
    >
      {children}
    </View>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const settingsFromStore = useGameState().settings;
  const { dispatch } = useGameActions();

  const [settings, setSettings] = useState<MatchSettings>(settingsFromStore ?? DEFAULT_MATCH_SETTINGS);

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
        <ScreenHeader title={strings.setup.title} onBack={() => router.replace('/')} />
        <ScrollView className="flex-1 px-8" contentContainerClassName="pt-4">
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
              <HorizontalPicker
                label={strings.setup.wordCount}
                options={[...WORD_COUNTS]}
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
        <ScreenFooter hint={strings.setup.wordSetNote} label={strings.common.next} onPress={onNext} />
      </SafeAreaView>
    </ImageBackground>
  );
}
