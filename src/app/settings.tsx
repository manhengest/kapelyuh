import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      title="Налаштування"
      description="Звук, вібрація та тема — у Phase 4."
      links={[{ href: '/', label: 'На головну' }]}
    />
  );
}
