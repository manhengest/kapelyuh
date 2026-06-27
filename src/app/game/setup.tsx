import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TEAM_NAME_SUGGESTIONS } from '@content/randomNames';
import { strings } from '@content/strings';
import type { Difficulty, MatchSettings, Team } from '@domain/game/types';
import { DEFAULT_MATCH_SETTINGS } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { selectSessionWordIds } from '@features/game/words';
import { createId } from '@shared/lib/id';
import { Button } from '@ui/components/Button';
import { HorizontalPicker, MultiPicker } from '@ui/components/HorizontalPicker';
import { ScreenHeader } from '@ui/components/ScreenHeader';

const WORD_COUNTS = [30, 45, 60, 75, 90] as const;
const TURN_DURATIONS_SEC = [60, 90, 120] as const;
const TEAM_COUNTS = [2, 3, 4, 5, 6, 7, 8] as const;

function createDefaultTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, index) => ({
    id: createId('team'),
    name: TEAM_NAME_SUGGESTIONS[index] ?? `Команда ${index + 1}`,
    scores: { elias: 0, crocodile: 0, association: 0 },
  }));
}

export default function SetupScreen() {
  const router = useRouter();
  const status = useGameState().status;
  const settingsFromStore = useGameState().settings;
  const teamsFromStore = useGameState().teams;
  const { dispatch } = useGameActions();

  const [settings, setSettings] = useState<MatchSettings>(settingsFromStore ?? DEFAULT_MATCH_SETTINGS);
  const [teams, setTeams] = useState<Team[]>(() =>
    teamsFromStore.length > 0 ? teamsFromStore : createDefaultTeams(settings.teamCount),
  );
  const [isSelectingWords, setIsSelectingWords] = useState(false);

  const step = status === 'setup_teams' ? 'teams' : 'settings';

  const difficultyOptions = useMemo(
    () => [
      { value: 'easy' as Difficulty, label: strings.setup.difficultyEasy },
      { value: 'medium' as Difficulty, label: strings.setup.difficultyMedium },
      { value: 'hard' as Difficulty, label: strings.setup.difficultyHard },
    ],
    [],
  );

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSettings((current) => {
      const exists = current.difficulties.includes(difficulty);
      const difficulties = exists
        ? current.difficulties.filter((entry) => entry !== difficulty)
        : [...current.difficulties, difficulty];
      return { ...current, difficulties: difficulties.length > 0 ? difficulties : [difficulty] };
    });
  };

  const updateTeamCount = (teamCount: number) => {
    setSettings((current) => ({ ...current, teamCount }));
    setTeams((current) => {
      if (current.length === teamCount) {
        return current;
      }
      if (current.length > teamCount) {
        return current.slice(0, teamCount);
      }
      const extra = Array.from({ length: teamCount - current.length }, (_, index) => ({
        id: createId('team'),
        name: TEAM_NAME_SUGGESTIONS[current.length + index] ?? `Команда ${current.length + index + 1}`,
        scores: { elias: 0, crocodile: 0, association: 0 },
      }));
      return [...current, ...extra];
    });
  };

  const onSettingsNext = () => {
    setTeams(createDefaultTeams(settings.teamCount));
    dispatch({ type: 'SETTINGS_COMPLETED', settings });
  };

  const onTeamsNext = async () => {
    setIsSelectingWords(true);
    try {
      const sessionWordIds = await selectSessionWordIds(settings);
      dispatch({ type: 'TEAMS_COMPLETED', teams, sessionWordIds });
    } finally {
      setIsSelectingWords(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScreenHeader
        title={step === 'settings' ? strings.setup.title : strings.setup.teamsTitle}
        showHome
        onHomePress={() => router.replace('/')}
        textColor="#111827"
      />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8 pt-4">
        {step === 'settings' ? (
          <>
            <HorizontalPicker
              label={strings.setup.wordCount}
              options={[...WORD_COUNTS]}
              value={settings.wordCount}
              onChange={(wordCount) => setSettings((current) => ({ ...current, wordCount }))}
            />
            <HorizontalPicker
              label={strings.setup.turnDuration}
              options={[...TURN_DURATIONS_SEC]}
              value={settings.turnDurationMs / 1000}
              formatOption={(seconds) => `${seconds} сек`}
              onChange={(seconds) =>
                setSettings((current) => ({ ...current, turnDurationMs: seconds * 1000 }))
              }
            />
            <HorizontalPicker
              label={strings.setup.teamCount}
              options={[...TEAM_COUNTS]}
              value={settings.teamCount}
              onChange={updateTeamCount}
            />
            <MultiPicker
              label={strings.setup.difficulty}
              options={difficultyOptions}
              values={settings.difficulties}
              onToggle={toggleDifficulty}
            />
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
              {strings.setup.skipPenalty}
            </Text>
            <View className="mb-6 gap-2">
              {[0, -1].map((penalty) => (
                <Button
                  key={penalty}
                  label={
                    penalty === 0 ? strings.setup.skipPenaltyNone : strings.setup.skipPenaltyMinusOne
                  }
                  variant={settings.skipPenalty === penalty ? 'primary' : 'outline'}
                  onPress={() => setSettings((current) => ({ ...current, skipPenalty: penalty as 0 | -1 }))}
                />
              ))}
            </View>
          </>
        ) : (
          <View className="gap-3">
            {teams.map((team, index) => (
              <View key={team.id} className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <Text className="mb-1 text-xs uppercase text-slate-500">Команда {index + 1}</Text>
                <TextInput
                  value={team.name}
                  onChangeText={(name) =>
                    setTeams((current) =>
                      current.map((entry) => (entry.id === team.id ? { ...entry, name } : entry)),
                    )
                  }
                  placeholder={strings.setup.teamPlaceholder}
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <View className="px-5 pb-6">
        <Button
          label={strings.common.next}
          disabled={(step === 'teams' && teams.length < 2) || isSelectingWords}
          onPress={step === 'settings' ? onSettingsNext : onTeamsNext}
        />
      </View>
    </SafeAreaView>
  );
}
