import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function RoundIntroScreen() {
  return (
    <PlaceholderScreen
      title="Тур 1 — Еліас"
      description="Повноекранна картка туру з правилами."
      links={[{ href: '/game/pre-turn', label: 'Далі' }]}
    />
  );
}
