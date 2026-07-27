import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { TEAM_NAME_SUGGESTIONS } from '@content/randomNames';
import { strings } from '@content/strings';
import type { MatchSettings, Team } from '@domain/game/types';
import { useGameActions, useGameState } from '@features/game/hooks';
import { selectSessionWordIds } from '@features/game/words';
import { playTap } from '@infrastructure/audio/sounds';
import { triggerHaptic } from '@infrastructure/haptics';
import { createId } from '@shared/lib/id';
import { ContentColumn } from '@ui/components/ContentColumn';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.png');

function pickUniqueRandomName(usedNames: ReadonlySet<string>, fallbackIndex: number): string {
  const pool = TEAM_NAME_SUGGESTIONS.filter((name) => !usedNames.has(name));
  return pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]!
    : `Команда ${fallbackIndex + 1}`;
}

function createDefaultTeams(count: number): Team[] {
  const used = new Set<string>();
  return Array.from({ length: count }, (_, index) => {
    const name = pickUniqueRandomName(used, index);
    used.add(name);
    return {
      id: createId('team'),
      name,
      scores: { elias: 0, crocodile: 0, association: 0 },
    };
  });
}

function resolveTeams(teamsFromStore: Team[], teamCount: number): Team[] {
  if (teamsFromStore.length === teamCount) {
    return teamsFromStore;
  }
  return createDefaultTeams(teamCount);
}

function teamsEditorKey(teamsFromStore: Team[], teamCount: number): string {
  const teamIds = teamsFromStore.map((team) => team.id).join(',');
  return `${teamCount}:${teamIds}`;
}

type TeamsEditorProps = {
  settings: MatchSettings;
  teamsFromStore: Team[];
  teamCount: number;
};

function TeamsEditor({ settings, teamsFromStore, teamCount }: TeamsEditorProps) {
  const { dispatch } = useGameActions();
  const [teams, setTeams] = useState<Team[]>(() => resolveTeams(teamsFromStore, teamCount));

  const renameTeam = (teamId: string) => {
    setTeams((current) => {
      const index = current.findIndex((team) => team.id === teamId);
      if (index < 0) return current;

      const usedNames = new Set(current.map((team) => team.name));
      const name = pickUniqueRandomName(usedNames, index);

      return current.map((entry) => (entry.id === teamId ? { ...entry, name } : entry));
    });
  };

  const onNext = async () => {
    const sessionWordIds = await selectSessionWordIds(settings);
    dispatch({ type: 'TEAMS_COMPLETED', teams, sessionWordIds });
  };

  return (
    <>
      <ScrollView className="flex-1 px-8" contentContainerClassName="pt-4">
        <View className="gap-3">
          {teams.map((team) => (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              accessibilityLabel="Змінити назву команди"
              onPress={() => {
                void triggerHaptic('light');
                playTap();
                renameTeam(team.id);
              }}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 10,
              }}
              className="flex-row items-center rounded-3xl bg-white px-8 py-6 transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              <View className="flex-1">
                <Text className="text-2xl font-bold text-primaryText">{team.name}</Text>
              </View>
              <View className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-pink opacity-80">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <ScreenFooter
        hint={strings.setup.teamHint}
        label={strings.common.next}
        onPress={onNext}
      />
    </>
  );
}

export default function TeamsScreen() {
  const { settings, teams: teamsFromStore } = useGameState();
  const { dispatch } = useGameActions();

  if (!settings) {
    return null;
  }

  const teamCount = settings.teamCount;

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ContentColumn className="flex-1">
          <ScreenHeader
            title={strings.setup.teamsTitle}
            onBack={() => dispatch({ type: 'BACK_TO_SETTINGS' })}
          />
          <TeamsEditor
            key={teamsEditorKey(teamsFromStore, teamCount)}
            settings={settings}
            teamsFromStore={teamsFromStore}
            teamCount={teamCount}
          />
        </ContentColumn>
      </SafeAreaView>
    </ImageBackground>
  );
}
