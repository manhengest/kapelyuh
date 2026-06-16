import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function AboutScreen() {
  return (
    <PlaceholderScreen
      title="Про гру"
      description="Капелюх — офлайн party game для iPhone. Версія 1.0.0 (Phase 0)."
      links={[{ href: '/', label: 'На головну' }]}
    />
  );
}
