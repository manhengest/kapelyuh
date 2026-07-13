import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TEAM_NAME_SUGGESTIONS } from '@content/randomNames';
import { strings } from '@content/strings';
import type { Team } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { selectSessionWordIds } from '@features/game/words';
import { createId } from '@shared/lib/id';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.png');

function pickRandomName(exclude: string): string {
  const pool = TEAM_NAME_SUGGESTIONS.filter((n) => n !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] ?? exclude;
}

function createDefaultTeams(count: number): Team[] {
  const used = new Set<string>();
  return Array.from({ length: count }, (_, index) => {
    const pool = TEAM_NAME_SUGGESTIONS.filter((n) => !used.has(n));
    const name = pool[index % pool.length] ?? `Команда ${index + 1}`;
    used.add(name);
    return {
      id: createId('team'),
      name,
      scores: { elias: 0, crocodile: 0, association: 0 },
    };
  });
}

export default function TeamsScreen() {
  const { settings, teams: teamsFromStore } = useGameState();
  const { dispatch } = useGameActions();

  const [teams, setTeams] = useState<Team[]>(() =>
    teamsFromStore.length > 0 ? teamsFromStore : createDefaultTeams(settings?.teamCount ?? 2),
  );
  const [isSelectingWords, setIsSelectingWords] = useState(false);

  const renameTeam = (teamId: string) => {
    setTeams((current) =>
      current.map((entry) =>
        entry.id === teamId ? { ...entry, name: pickRandomName(entry.name) } : entry,
      ),
    );
  };

  const onNext = async () => {
    if (!settings) return;
    setIsSelectingWords(true);
    try {
      const sessionWordIds = await selectSessionWordIds(settings);
      dispatch({ type: 'TEAMS_COMPLETED', teams, sessionWordIds });
    } finally {
      setIsSelectingWords(false);
    }
  };

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScreenHeader
          title={strings.setup.teamsTitle}
          onBack={() => dispatch({ type: 'BACK_TO_SETTINGS' })}
        />
        <ScrollView className="flex-1 px-8" contentContainerClassName="pt-4">
          <View className="gap-3">
            {teams.map((team) => (
              <Pressable
                key={team.id}
                accessibilityRole="button"
                accessibilityLabel="Змінити назву команди"
                onPress={() => renameTeam(team.id)}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 5, height: 5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 10,
                }}
                className="flex-row items-center rounded-3xl bg-white px-8 py-6 transition-transform duration-150 ease-out active:scale-95"
              >
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-primaryText">{team.name}</Text>
                </View>
                <View className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-pink opacity-80">
                  <Text className="text-xl color-white">↺</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <ScreenFooter
          hint={strings.setup.teamHint}
          label={strings.common.next}
          disabled={teams.length < 2 || isSelectingWords}
          onPress={onNext}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}
