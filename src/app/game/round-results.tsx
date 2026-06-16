import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function RoundResultsScreen() {
  return (
    <PlaceholderScreen
      title="Результати туру"
      links={[{ href: '/game/results', label: 'Результати гри' }]}
    />
  );
}
