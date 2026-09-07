import { Stack } from 'expo-router';

import { useGameStore } from '@features/game/store';

export default function GameLayout() {
  const navDirection = useGameStore((store) => store.navDirection);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animationTypeForReplace: navDirection === 'backward' ? 'pop' : 'push',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="setup" options={{ animationTypeForReplace: 'pop' }} />
    </Stack>
  );
}
