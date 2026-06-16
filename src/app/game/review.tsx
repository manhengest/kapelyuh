import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function ReviewScreen() {
  return (
    <PlaceholderScreen
      title="Перегляд ходу"
      description="Список слів із можливістю оскаржити результат."
      links={[{ href: '/game/round-results', label: 'Наступна команда' }]}
    />
  );
}
