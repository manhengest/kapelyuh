import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function PreTurnScreen() {
  return (
    <PlaceholderScreen
      title="Команда готується до гри"
      links={[{ href: '/game/turn', label: 'Поїхали!' }]}
    />
  );
}
