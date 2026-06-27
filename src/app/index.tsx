import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { STATUS_ROUTE } from '@features/game/hooks';
import { useHydrateGameStore } from '@features/game/navigation';
import { hasResumableMatch, useGameStore } from '@features/game/store';
import { Button } from '@ui/components/Button';

export default function HomeScreen() {
  const router = useRouter();
  const hydrated = useHydrateGameStore();
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const canResume = hydrated && hasResumableMatch(state);

  const startNewGame = () => {
    dispatch({ type: 'START_SETUP' });
    router.push('/game/setup');
  };

  const resumeGame = () => {
    const target = STATUS_ROUTE[state.status] ?? '/game/setup';
    router.push(target);
  };

  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <Text className="text-base text-slate-600 dark:text-slate-300">Завантаження…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.home.openSettings}
          onPress={() => router.push('/settings')}
          className="h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Text className="text-xl">⚙️</Text>
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="text-5xl">🎩</Text>
        <Text className="text-center text-4xl font-bold text-slate-900 dark:text-white">
          {strings.appName}
        </Text>
        <Text className="text-center text-base text-slate-600 dark:text-slate-300">
          {strings.home.tagline}
        </Text>
      </View>
      <View className="gap-3 px-5 pb-8">
        {canResume ? (
          <Button label={strings.home.resumeGame} onPress={resumeGame} />
        ) : null}
        <Button label={strings.home.newGame} onPress={startNewGame} variant={canResume ? 'outline' : 'primary'} />
        <Button label={strings.home.rules} variant="outline" onPress={() => router.push('/rules')} />
      </View>
    </SafeAreaView>
  );
}
