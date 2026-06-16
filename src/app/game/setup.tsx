import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function GameSetupScreen() {
  return (
    <PlaceholderScreen
      title="Налаштування гри"
      links={[
        { href: '/game/round-intro', label: 'Далі' },
        { href: '/', label: 'На головну' },
      ]}
    />
  );
}
