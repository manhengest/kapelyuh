import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function ResultsScreen() {
  return (
    <PlaceholderScreen
      title="Гру завершено"
      description="П’єдестал і таблиця балів за турами."
      links={[{ href: '/', label: 'Зіграти ще!' }]}
    />
  );
}
