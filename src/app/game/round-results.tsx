import { Redirect } from 'expo-router';

import { useGameRouteSync } from '@features/game/navigation';

/** Legacy route — round results are shown inside review. */
export default function RoundResultsScreen() {
  useGameRouteSync();
  return <Redirect href="/game/review" />;
}
