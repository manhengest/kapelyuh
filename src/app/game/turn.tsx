import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function TurnScreen() {
  return (
    <PlaceholderScreen
      title="Хід команди"
      description="Слово, таймер, кнопки ✓ і ×."
      links={[{ href: '/game/review', label: 'Завершити хід' }]}
    />
  );
}
